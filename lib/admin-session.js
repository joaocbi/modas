import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "modas-admin-session";
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;

function bytesToBase64Url(bytes) {
    let binary = "";

    bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
    });

    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value) {
    const base64Value = value.replace(/-/g, "+").replace(/_/g, "/");
    const paddedValue = base64Value.padEnd(Math.ceil(base64Value.length / 4) * 4, "=");
    const binary = atob(paddedValue);

    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function encodeJson(value) {
    const encoder = new TextEncoder();
    return bytesToBase64Url(encoder.encode(JSON.stringify(value)));
}

function decodeJson(value) {
    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(base64UrlToBytes(value)));
}

function getSessionSecret() {
    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!secret) {
        throw new Error("ADMIN_SESSION_SECRET is not configured.");
    }

    return new TextEncoder().encode(secret);
}

async function signTokenValue(payloadSegment) {
    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        getSessionSecret(),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(payloadSegment));
    return bytesToBase64Url(new Uint8Array(signature));
}

export function isAdminConfigured() {
    return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET);
}

export async function createAdminSession(payload) {
    const payloadSegment = encodeJson({
        ...payload,
        iat: Date.now(),
        exp: Date.now() + SESSION_DURATION_MS,
    });
    const signatureSegment = await signTokenValue(payloadSegment);

    return `${payloadSegment}.${signatureSegment}`;
}

export async function verifyAdminSession(token) {
    const [payloadSegment, signatureSegment] = String(token || "").split(".");

    if (!payloadSegment || !signatureSegment) {
        throw new Error("Invalid token format.");
    }

    const expectedSignature = await signTokenValue(payloadSegment);

    if (expectedSignature !== signatureSegment) {
        throw new Error("Invalid token signature.");
    }

    const payload = decodeJson(payloadSegment);

    if (Number(payload.exp || 0) < Date.now()) {
        throw new Error("Expired token.");
    }

    return payload;
}

export async function getAdminSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
        return null;
    }

    try {
        return await verifyAdminSession(token);
    } catch (error) {
        console.log("[AdminSession] Failed to verify session.", error);
        return null;
    }
}

export function getSessionCookieName() {
    return SESSION_COOKIE_NAME;
}
