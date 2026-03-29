import { NextResponse } from "next/server";
import { createProduct, deleteProduct, getAllProducts, updateProduct } from "../../../../lib/product-store";

export async function GET() {
    const products = await getAllProducts();
    return NextResponse.json({
        ok: true,
        products,
    });
}

export async function POST(request) {
    try {
        const payload = await request.json();
        const product = await createProduct(payload);
        return NextResponse.json({
            ok: true,
            product,
        });
    } catch (error) {
        console.log("[AdminProducts] Failed to create product.", error);
        return NextResponse.json(
            {
                ok: false,
                message: "Não foi possível criar o produto.",
            },
            { status: 500 }
        );
    }
}

export async function PATCH(request) {
    try {
        const payload = await request.json();
        const product = await updateProduct(payload.id, payload);
        return NextResponse.json({
            ok: true,
            product,
        });
    } catch (error) {
        console.log("[AdminProducts] Failed to update product.", error);
        return NextResponse.json(
            {
                ok: false,
                message: "Não foi possível atualizar o produto.",
            },
            { status: 500 }
        );
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        await deleteProduct(searchParams.get("id"));
        return NextResponse.json({
            ok: true,
        });
    } catch (error) {
        console.log("[AdminProducts] Failed to delete product.", error);
        return NextResponse.json(
            {
                ok: false,
                message: "Não foi possível remover o produto.",
            },
            { status: 500 }
        );
    }
}
