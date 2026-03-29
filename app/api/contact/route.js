import { NextResponse } from "next/server";
import { getContactChannels } from "../../../lib/contact";

function getRequiredEnv(name) {
    const value = process.env[name];
    return typeof value === "string" ? value.trim() : "";
}

export async function POST(request) {
    try {
        const payload = await request.json();
        const subject = String(payload?.subject || "").trim();
        const body = String(payload?.body || "").trim();
        const replyTo = String(payload?.replyTo || "").trim();

        if (!subject || !body) {
            return NextResponse.json(
                { ok: false, message: "Missing subject or body." },
                { status: 400 }
            );
        }

        const resendApiKey = getRequiredEnv("RESEND_API_KEY");
        const from = getRequiredEnv("CONTACT_EMAIL_FROM");
        const to = getRequiredEnv("CONTACT_EMAIL_TO") || getContactChannels().email;

        if (!resendApiKey || !from) {
            console.log("[Contact API] Missing e-mail provider configuration.");

            return NextResponse.json(
                {
                    ok: false,
                    message: "Email provider not configured.",
                    fallbackToMailto: true,
                },
                { status: 503 }
            );
        }

        const resendResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from,
                to: [to],
                subject,
                text: body,
                reply_to: replyTo || undefined,
            }),
        });

        if (!resendResponse.ok) {
            const errorBody = await resendResponse.text();
            console.log("[Contact API] Resend request failed.", {
                status: resendResponse.status,
                errorBody,
            });

            return NextResponse.json(
                {
                    ok: false,
                    message: "Failed to send e-mail via provider.",
                    fallbackToMailto: true,
                },
                { status: 502 }
            );
        }

        const data = await resendResponse.json();
        console.log("[Contact API] E-mail sent successfully.", data);

        return NextResponse.json({
            ok: true,
            message: "E-mail sent successfully.",
        });
    } catch (error) {
        console.log("[Contact API] Unexpected error while sending e-mail.", error);

        return NextResponse.json(
            {
                ok: false,
                message: "Unexpected error while sending e-mail.",
                fallbackToMailto: true,
            },
            { status: 500 }
        );
    }
}
