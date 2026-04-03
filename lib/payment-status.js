function normalizePaymentStatus(status) {
    return String(status || "").trim().toLowerCase();
}

export function mapMercadoPagoPaymentStatusToOrderStatus(status) {
    const normalizedStatus = normalizePaymentStatus(status);

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

export function isMercadoPagoPaymentFinalStatus(status) {
    const normalizedStatus = normalizePaymentStatus(status);
    return ["approved", "cancelled", "rejected", "refunded", "charged_back"].includes(normalizedStatus);
}

export function shouldSendCustomerPaymentNotification(status) {
    const normalizedStatus = normalizePaymentStatus(status);
    return ["approved", "cancelled", "rejected", "refunded", "charged_back"].includes(normalizedStatus);
}

