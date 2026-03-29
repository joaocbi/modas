const WHATSAPP_NUMBER = "551234567890";
const SUPPORT_EMAIL = "devillefashions@gmail.com";

function cleanValue(value) {
    return String(value ?? "").trim();
}

export function buildFieldLines(fields) {
    return fields
        .filter((field) => cleanValue(field.value))
        .map((field) => `${field.label}: ${cleanValue(field.value)}`)
        .join("\n");
}

export function buildWhatsAppUrl(message) {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function buildMailtoUrl({ subject, body }) {
    return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function getContactChannels() {
    return {
        whatsapp: WHATSAPP_NUMBER,
        email: SUPPORT_EMAIL,
    };
}
