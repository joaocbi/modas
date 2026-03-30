import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAdminSession, getSessionCookieName, isAdminConfigured } from "../../../../lib/admin-session";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_BLOCK_MS = 15 * 60 * 1000;
const loginAttempts = globalThis.__modasAdminLoginAttempts || new Map();

if (!globalThis.__modasAdminLoginAttempts) {
    globalThis.__modasAdminLoginAttempts = loginAttempts;
}

function getClientIdentifier(request) {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const clientIp = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";
    return clientIp;
}

function getAttemptRecord(identifier) {
    const now = Date.now();
    const currentRecord = loginAttempts.get(identifier);

    if (!currentRecord) {
        return {
            count: 0,
            firstAttemptAt: now,
            blockedUntil: 0,
        };
    }

    if (currentRecord.firstAttemptAt + LOGIN_WINDOW_MS <= now) {
        return {
            count: 0,
            firstAttemptAt: now,
            blockedUntil: 0,
        };
    }

    return currentRecord;
}

function registerFailedAttempt(identifier) {
    const now = Date.now();
    const currentRecord = getAttemptRecord(identifier);
    const nextCount = currentRecord.count + 1;
    const nextRecord = {
        count: nextCount,
        firstAttemptAt: currentRecord.firstAttemptAt || now,
        blockedUntil: nextCount >= MAX_LOGIN_ATTEMPTS ? now + LOGIN_BLOCK_MS : 0,
    };

    loginAttempts.set(identifier, nextRecord);
    return nextRecord;
}

function clearFailedAttempts(identifier) {
    loginAttempts.delete(identifier);
}

export async function POST(request) {
    try {
        if (!isAdminConfigured()) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "Admin environment variables are not configured yet.",
                },
                { status: 503 }
            );
        }

        const clientIdentifier = getClientIdentifier(request);
        const currentAttempt = getAttemptRecord(clientIdentifier);

        if (currentAttempt.blockedUntil > Date.now()) {
            const retryAfterMinutes = Math.ceil((currentAttempt.blockedUntil - Date.now()) / 60000);
            return NextResponse.json(
                {
                    ok: false,
                    message: `Muitas tentativas de login. Tente novamente em ${retryAfterMinutes} minuto(s).`,
                },
                { status: 429 }
            );
        }

        const { email, password } = await request.json();
        const normalizedEmail = String(email || "").trim().toLowerCase();
        const normalizedPassword = String(password || "");

        if (
            normalizedEmail !== String(process.env.ADMIN_EMAIL || "").trim().toLowerCase() ||
            normalizedPassword !== String(process.env.ADMIN_PASSWORD || "")
        ) {
            registerFailedAttempt(clientIdentifier);
            return NextResponse.json(
                {
                    ok: false,
                    message: "Credenciais inválidas.",
                },
                { status: 401 }
            );
        }

        const token = await createAdminSession({
            email: normalizedEmail,
            role: "admin",
        });
        clearFailedAttempts(clientIdentifier);

        const cookieStore = await cookies();
        cookieStore.set(getSessionCookieName(), token, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 12,
        });

        console.log("[AdminAuth] Admin signed in successfully.", { email: normalizedEmail });

        return NextResponse.json({
            ok: true,
        });
    } catch (error) {
        console.log("[AdminAuth] Failed to sign in admin.", error);
        return NextResponse.json(
            {
                ok: false,
                message: "Não foi possível concluir o login.",
            },
            { status: 500 }
        );
    }
}
