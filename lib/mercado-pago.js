const MERCADO_PAGO_API_URL = "https://api.mercadopago.com";

export function getMercadoPagoAccessToken() {
    return String(process.env.MERCADO_PAGO_ACCESS_TOKEN || "").trim();
}

export function getMercadoPagoPublicKey() {
    return String(process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || "").trim();
}

export function isMercadoPagoConfigured() {
    return Boolean(getMercadoPagoAccessToken());
}

export async function mercadoPagoRequest(pathname, init = {}) {
    const accessToken = getMercadoPagoAccessToken();

    if (!accessToken) {
        throw new Error("Mercado Pago access token is missing.");
    }

    const requestUrl = `${MERCADO_PAGO_API_URL}${pathname}`;
    const response = await fetch(requestUrl, {
        ...init,
        cache: "no-store",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            ...(init.headers || {}),
        },
    });

    const rawBody = await response.text();
    let parsedBody = null;

    try {
        parsedBody = rawBody ? JSON.parse(rawBody) : null;
    } catch (error) {
        parsedBody = {
            rawBody,
        };
    }

    if (!response.ok) {
        console.log("[MercadoPago] Request failed.", {
            pathname,
            status: response.status,
            body: parsedBody,
        });
        throw new Error(`Mercado Pago request failed with status ${response.status}.`);
    }

    console.log("[MercadoPago] Request completed.", {
        pathname,
        status: response.status,
    });
    return parsedBody;
}

export async function createMercadoPagoPayment(payload, options = {}) {
    const idempotencyKey = String(options.idempotencyKey || crypto.randomUUID()).trim();

    return mercadoPagoRequest("/v1/payments", {
        method: "POST",
        headers: {
            "X-Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(payload),
    });
}

export async function getMercadoPagoPayment(paymentId) {
    return mercadoPagoRequest(`/v1/payments/${paymentId}`, {
        method: "GET",
    });
}
