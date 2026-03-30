import { NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "modas-admin-session";
const ADMIN_UNAUTHORIZED_MESSAGE = "Sessão admin inválida ou expirada.";

function getSessionSecret() {
    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!secret) {
        return null;
    }

    return new TextEncoder().encode(secret);
}

export async function middleware(request) {
    const { pathname } = request.nextUrl;
    const isAdminLoginRoute = pathname === "/admin/login" || pathname === "/api/admin/login";
    const isAdminApiRoute = pathname.startsWith("/api/admin/");

    if (isAdminLoginRoute) {
        return NextResponse.next();
    }

    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const secret = getSessionSecret();

    if (!token || !secret) {
        if (isAdminApiRoute) {
            return NextResponse.json(
                {
                    ok: false,
                    message: ADMIN_UNAUTHORIZED_MESSAGE,
                },
                { status: 401 }
            );
        }

        const loginUrl = new URL("/admin/login", request.url);
        return NextResponse.redirect(loginUrl);
    }

    try {
        const [payloadSegment, signatureSegment] = token.split(".");

        if (!payloadSegment || !signatureSegment) {
            throw new Error("Invalid token format.");
        }

        const cryptoKey = await crypto.subtle.importKey(
            "raw",
            secret,
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );

        const signature = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(payloadSegment));
        let binary = "";

        new Uint8Array(signature).forEach((byte) => {
            binary += String.fromCharCode(byte);
        });

        const expectedSignature = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

        if (expectedSignature !== signatureSegment) {
            throw new Error("Invalid token signature.");
        }

        const base64Value = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
        const paddedValue = base64Value.padEnd(Math.ceil(base64Value.length / 4) * 4, "=");
        const payload = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(paddedValue), (character) => character.charCodeAt(0))));

        if (Number(payload.exp || 0) < Date.now()) {
            throw new Error("Expired token.");
        }

        return NextResponse.next();
    } catch (error) {
        console.log("[Middleware] Invalid admin session.", error);

        if (isAdminApiRoute) {
            return NextResponse.json(
                {
                    ok: false,
                    message: ADMIN_UNAUTHORIZED_MESSAGE,
                },
                { status: 401 }
            );
        }

        const loginUrl = new URL("/admin/login", request.url);
        return NextResponse.redirect(loginUrl);
    }
}

export const config = {
    matcher: ["/admin/:path*", "/api/admin/:path*"],
};
