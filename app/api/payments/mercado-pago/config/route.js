import { NextResponse } from "next/server";
import { getMercadoPagoPublicKey, isMercadoPagoConfigured } from "../../../../../lib/mercado-pago";

export async function GET() {
    const publicKey = getMercadoPagoPublicKey();
    const enabled = isMercadoPagoConfigured();

    console.log("[MercadoPagoConfig] Loaded payment config.", {
        enabled,
        hasPublicKey: Boolean(publicKey),
    });

    return NextResponse.json({
        ok: true,
        enabled,
        publicKey,
        cardEnabled: enabled && Boolean(publicKey),
        pixEnabled: enabled,
    });
}
