import { NextResponse } from "next/server";
import { getAdminSession, getAdminUnauthorizedResponse } from "../../../../lib/admin-session";
import { createCoupon, deleteCoupon, getAllCoupons, updateCoupon } from "../../../../lib/coupon-store";

export async function GET() {
    const session = await getAdminSession();
    if (!session) {
        return getAdminUnauthorizedResponse();
    }

    const coupons = await getAllCoupons();
    return NextResponse.json({
        ok: true,
        coupons,
    });
}

export async function POST(request) {
    const session = await getAdminSession();
    if (!session) {
        return getAdminUnauthorizedResponse();
    }

    try {
        const payload = await request.json();
        const coupon = await createCoupon(payload);
        return NextResponse.json({
            ok: true,
            coupon,
        });
    } catch (error) {
        console.log("[AdminCoupons] Failed to create coupon.", error);
        return NextResponse.json(
            {
                ok: false,
                message: "Não foi possível criar o cupom.",
            },
            { status: 500 }
        );
    }
}

export async function PATCH(request) {
    const session = await getAdminSession();
    if (!session) {
        return getAdminUnauthorizedResponse();
    }

    try {
        const payload = await request.json();
        const coupon = await updateCoupon(payload.id, payload);
        return NextResponse.json({
            ok: true,
            coupon,
        });
    } catch (error) {
        console.log("[AdminCoupons] Failed to update coupon.", error);
        return NextResponse.json(
            {
                ok: false,
                message: "Não foi possível atualizar o cupom.",
            },
            { status: 500 }
        );
    }
}

export async function DELETE(request) {
    const session = await getAdminSession();
    if (!session) {
        return getAdminUnauthorizedResponse();
    }

    try {
        const { searchParams } = new URL(request.url);
        await deleteCoupon(searchParams.get("id"));
        return NextResponse.json({
            ok: true,
        });
    } catch (error) {
        console.log("[AdminCoupons] Failed to delete coupon.", error);
        return NextResponse.json(
            {
                ok: false,
                message: "Não foi possível remover o cupom.",
            },
            { status: 500 }
        );
    }
}
