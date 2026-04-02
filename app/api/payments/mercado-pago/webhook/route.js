import { NextResponse } from "next/server";
import { getMercadoPagoPayment } from "../../../../../lib/mercado-pago";
import { getOrderById, updateOrder } from "../../../../../lib/order-store";

function mapPaymentStatusToOrderStatus(status) {
    const normalizedStatus = String(status || "").trim().toLowerCase();

    if (normalizedStatus === "approved") {
        return "paid";
    }

    if (normalizedStatus === "pending") {
        return "pending_payment";
    }

    if (normalizedStatus === "in_process" || normalizedStatus === "authorized") {
        return "processing_payment";
    }

    if (normalizedStatus === "cancelled" || normalizedStatus === "rejected" || normalizedStatus === "refunded" || normalizedStatus === "charged_back") {
        return "payment_failed";
    }

    return "payment_pending_review";
}

function extractPaymentId(searchParams, body) {
    return (
        searchParams.get("data.id") ||
        searchParams.get("id") ||
        body?.data?.id ||
        body?.resource?.split("/")?.pop() ||
        body?.id ||
        ""
    );
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    console.log("[MercadoPagoWebhook] Validation request received.", Object.fromEntries(searchParams.entries()));

    return NextResponse.json({
        ok: true,
    });
}

export async function POST(request) {
    let body = {};

    try {
        body = await request.json();
    } catch (error) {
        console.log("[MercadoPagoWebhook] Webhook payload is empty or not JSON.");
    }

    try {
        const { searchParams } = new URL(request.url);
        const topic = String(searchParams.get("type") || searchParams.get("topic") || body?.type || body?.action || "").trim().toLowerCase();
        const paymentId = extractPaymentId(searchParams, body);

        console.log("[MercadoPagoWebhook] Notification received.", {
            topic,
            paymentId,
        });

        if (topic && !topic.includes("payment")) {
            return NextResponse.json({ ok: true, ignored: true });
        }

        if (!paymentId) {
            return NextResponse.json({ ok: true, ignored: true });
        }

        const payment = await getMercadoPagoPayment(paymentId);
        const orderId = Number(payment.external_reference || 0);

        if (!orderId) {
            return NextResponse.json({ ok: true, ignored: true });
        }

        const existingOrder = await getOrderById(orderId);

        if (!existingOrder) {
            return NextResponse.json({ ok: true, ignored: true });
        }

        const nextStatus = mapPaymentStatusToOrderStatus(payment.status);
        const paymentMethod = String(payment.payment_method_id || "").trim().toLowerCase() === "pix" ? "pix" : "card";

        await updateOrder(orderId, {
            customer: existingOrder.customer,
            total: Number(payment.transaction_amount || existingOrder.total),
            status: nextStatus,
            channel: `mercado_pago_${paymentMethod}`,
            itemCount: existingOrder.itemCount,
        });

        console.log("[MercadoPagoWebhook] Order updated from webhook.", {
            orderId,
            paymentId,
            nextStatus,
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.log("[MercadoPagoWebhook] Failed to process webhook.", error);
        return NextResponse.json({ ok: true });
    }
}
