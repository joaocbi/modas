import { getOrderById, updateOrder } from "./order-store";
import { notifyCustomerAboutPayment } from "./payment-notifications";
import { mapMercadoPagoPaymentStatusToOrderStatus } from "./payment-status";

function resolvePaymentMethod(payment) {
    return String(payment?.payment_method_id || "").trim().toLowerCase() === "pix" ? "pix" : "card";
}

export function serializeMercadoPagoPayment(payment) {
    return {
        id: payment?.id || null,
        method: resolvePaymentMethod(payment),
        status: String(payment?.status || "").trim(),
        statusDetail: String(payment?.status_detail || "").trim(),
        qrCode: payment?.point_of_interaction?.transaction_data?.qr_code || "",
        qrCodeBase64: payment?.point_of_interaction?.transaction_data?.qr_code_base64 || "",
        ticketUrl: payment?.transaction_details?.external_resource_url || "",
    };
}

export async function syncMercadoPagoOrderWithPayment(payment, options = {}) {
    const orderId = Number(payment?.external_reference || 0);

    if (!orderId) {
        return {
            ok: false,
            ignored: true,
            reason: "missing_order_reference",
        };
    }

    const existingOrder = await getOrderById(orderId);

    if (!existingOrder) {
        return {
            ok: false,
            ignored: true,
            reason: "order_not_found",
            orderId,
        };
    }

    const nextStatus = mapMercadoPagoPaymentStatusToOrderStatus(payment?.status);
    const nextChannel = `mercado_pago_${resolvePaymentMethod(payment)}`;
    const hasStatusChanged = existingOrder.status !== nextStatus;
    const needsUpdate = hasStatusChanged || existingOrder.channel !== nextChannel || Number(existingOrder.total || 0) !== Number(payment?.transaction_amount || existingOrder.total);

    let nextOrder = existingOrder;

    if (needsUpdate) {
        nextOrder = await updateOrder(orderId, {
            customer: existingOrder.customer,
            total: Number(payment?.transaction_amount || existingOrder.total),
            status: nextStatus,
            channel: nextChannel,
            itemCount: existingOrder.itemCount,
        });
    }

    let notification = {
        skipped: true,
        reason: "payment_status_unchanged",
    };

    if (hasStatusChanged && !options.skipNotification) {
        notification = await notifyCustomerAboutPayment({
            orderId,
            payment,
        });
    }

    console.log("[MercadoPagoSync] Payment synchronized with order.", {
        orderId,
        paymentId: payment?.id,
        paymentStatus: payment?.status,
        nextStatus,
        hasStatusChanged,
        needsUpdate,
        notification,
    });

    return {
        ok: true,
        orderId,
        order: nextOrder,
        payment: serializeMercadoPagoPayment(payment),
        hasStatusChanged,
        notification,
    };
}

