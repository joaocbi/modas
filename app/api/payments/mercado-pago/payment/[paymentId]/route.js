import { NextResponse } from "next/server";
import { getMercadoPagoPayment, isMercadoPagoConfigured } from "../../../../../../lib/mercado-pago";
import { syncMercadoPagoOrderWithPayment } from "../../../../../../lib/mercado-pago-sync";

export async function GET(_request, context) {
    if (!isMercadoPagoConfigured()) {
        return NextResponse.json(
            {
                ok: false,
                message: "Mercado Pago nao esta configurado.",
            },
            { status: 503 }
        );
    }

    try {
        const paymentId = String(context?.params?.paymentId || "").trim();

        if (!paymentId) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "Payment id is required.",
                },
                { status: 400 }
            );
        }

        const payment = await getMercadoPagoPayment(paymentId);
        const syncResult = await syncMercadoPagoOrderWithPayment(payment);

        return NextResponse.json({
            ok: true,
            order: syncResult.order || null,
            payment: syncResult.payment,
        });
    } catch (error) {
        console.log("[MercadoPagoPaymentStatus] Failed to load payment status.", error);
        return NextResponse.json(
            {
                ok: false,
                message: "Nao foi possivel consultar o status do pagamento.",
            },
            { status: 500 }
        );
    }
}

