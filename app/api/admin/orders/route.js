import { NextResponse } from "next/server";
import { createOrder, deleteOrder, getAllOrders, updateOrder } from "../../../../lib/order-store";

export async function GET() {
    const orders = await getAllOrders();
    return NextResponse.json({
        ok: true,
        orders,
    });
}

export async function POST(request) {
    try {
        const payload = await request.json();
        const order = await createOrder(payload);
        return NextResponse.json({
            ok: true,
            order,
        });
    } catch (error) {
        console.log("[AdminOrders] Failed to create order.", error);
        return NextResponse.json(
            {
                ok: false,
                message: "Não foi possível criar o pedido.",
            },
            { status: 500 }
        );
    }
}

export async function PATCH(request) {
    try {
        const payload = await request.json();
        const order = await updateOrder(payload.id, payload);
        return NextResponse.json({
            ok: true,
            order,
        });
    } catch (error) {
        console.log("[AdminOrders] Failed to update order.", error);
        return NextResponse.json(
            {
                ok: false,
                message: "Não foi possível atualizar o pedido.",
            },
            { status: 500 }
        );
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        await deleteOrder(searchParams.get("id"));
        return NextResponse.json({
            ok: true,
        });
    } catch (error) {
        console.log("[AdminOrders] Failed to delete order.", error);
        return NextResponse.json(
            {
                ok: false,
                message: "Não foi possível remover o pedido.",
            },
            { status: 500 }
        );
    }
}
