import { shouldSendCustomerPaymentNotification } from "./payment-status";

function getOptionalEnv(name) {
    return typeof process.env[name] === "string" ? process.env[name].trim() : "";
}

function resolvePaymentMethodLabel(method) {
    return String(method || "").trim().toLowerCase() === "pix" ? "Pix" : "cartao";
}

function extractCustomerContact(payment) {
    const metadata = payment?.metadata && typeof payment.metadata === "object" ? payment.metadata : {};
    return {
        name: String(metadata.customerName || payment?.payer?.first_name || "").trim(),
        email: String(metadata.customerEmail || payment?.payer?.email || "").trim(),
        phone: String(metadata.customerPhone || "").trim(),
    };
}

function buildPaymentNotificationContent({ orderId, payment }) {
    const normalizedStatus = String(payment?.status || "").trim().toLowerCase();
    const paymentMethodLabel = resolvePaymentMethodLabel(payment?.payment_method_id);

    if (normalizedStatus === "approved") {
        return {
            subject: `Pagamento aprovado do pedido #${orderId}`,
            text: [
                `Seu pagamento do pedido #${orderId} foi aprovado.`,
                `Forma de pagamento: ${paymentMethodLabel}.`,
                "Seu pedido ja esta em separacao.",
            ].join("\n"),
        };
    }

    return {
        subject: `Pagamento nao aprovado do pedido #${orderId}`,
        text: [
            `Nao foi possivel aprovar o pagamento do pedido #${orderId}.`,
            `Forma de pagamento: ${paymentMethodLabel}.`,
            "Tente novamente ou entre em contato com o suporte para concluir a compra.",
        ].join("\n"),
    };
}

async function sendEmailNotification({ to, subject, text }) {
    const resendApiKey = getOptionalEnv("RESEND_API_KEY");
    const from = getOptionalEnv("PAYMENT_EMAIL_FROM") || getOptionalEnv("CONTACT_EMAIL_FROM");

    if (!resendApiKey || !from || !to) {
        return {
            sent: false,
            skipped: true,
            reason: "email_provider_not_configured",
        };
    }

    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from,
            to: [to],
            subject,
            text,
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.log("[PaymentNotifications] Failed to send payment e-mail.", {
            status: response.status,
            errorBody,
            to,
        });

        return {
            sent: false,
            skipped: false,
            reason: "email_provider_request_failed",
        };
    }

    console.log("[PaymentNotifications] Payment e-mail sent.", { to });
    return {
        sent: true,
        skipped: false,
    };
}

export async function notifyCustomerAboutPayment({ orderId, payment }) {
    if (!shouldSendCustomerPaymentNotification(payment?.status)) {
        return {
            skipped: true,
            reason: "payment_status_not_notifiable",
        };
    }

    const customer = extractCustomerContact(payment);
    const content = buildPaymentNotificationContent({ orderId, payment });
    const email = await sendEmailNotification({
        to: customer.email,
        subject: content.subject,
        text: content.text,
    });

    console.log("[PaymentNotifications] Customer notification processed.", {
        orderId,
        paymentStatus: payment?.status,
        email,
    });

    return {
        skipped: false,
        email,
    };
}

