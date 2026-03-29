import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAdminSession, getSessionCookieName, isAdminConfigured } from "../../../../lib/admin-session";

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

        const { email, password } = await request.json();
        const normalizedEmail = String(email || "").trim().toLowerCase();
        const normalizedPassword = String(password || "");

        if (
            normalizedEmail !== String(process.env.ADMIN_EMAIL || "").trim().toLowerCase() ||
            normalizedPassword !== String(process.env.ADMIN_PASSWORD || "")
        ) {
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
