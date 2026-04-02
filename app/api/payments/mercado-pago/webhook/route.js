import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getMercadoPagoPayment, getMercadoPagoWebhookSecret } from "../../../../../lib/mercado-pago";
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

function parseMercadoPagoSignature(signatureHeader) {
    const signatureEntries = String(signatureHeader || "")
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
        .reduce((accumulator, entry) => {
            const [key, value] = entry.split("=");

            if (key && value) {
                accumulator[key.trim()] = value.trim();
            }

            return accumulator;
        }, {});

    return {
        ts: signatureEntries.ts || "",
        v1: signatureEntries.v1 || "",
    };
}

function hasValidMercadoPagoSignature(request, searchParams, body) {
    const webhookSecret = getMercadoPagoWebhookSecret();

    if (!webhookSecret) {
        return true;
    }

    const signatureHeader = request.headers.get("x-signature");
    const requestId = request.headers.get("x-request-id");
    const { ts, v1 } = parseMercadoPagoSignature(signatureHeader);
    const paymentId = String(extractPaymentId(searchParams, body) || "").trim();

    if (!signatureHeader || !requestId || !ts || !v1 || !paymentId) {
        console.log("[MercadoPagoWebhook] Missing signature headers.", {
            hasSignatureHeader: Boolean(signatureHeader),
            hasRequestId: Boolean(requestId),
            hasTs: Boolean(ts),
            hasV1: Boolean(v1),
            hasPaymentId: Boolean(paymentId),
        });
        return false;
    }

    const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`;
    const generatedSignature = createHmac("sha256", webhookSecret).update(manifest).digest("hex");
    const receivedSignatureBuffer = Buffer.from(v1);
    const generatedSignatureBuffer = Buffer.from(generatedSignature);

    if (receivedSignatureBuffer.length !== generatedSignatureBuffer.length) {
        console.log("[MercadoPagoWebhook] Signature length mismatch.");
        return false;
    }

    const isValid = timingSafeEqual(receivedSignatureBuffer, generatedSignatureBuffer);

    if (!isValid) {
        console.log("[MercadoPagoWebhook] Invalid webhook signature.", {
            paymentId,
            requestId,
        });
    }

    return isValid;
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

        if (!hasValidMercadoPagoSignature(request, searchParams, body)) {
            return NextResponse.json({ ok: true, ignored: true, invalidSignature: true });
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
