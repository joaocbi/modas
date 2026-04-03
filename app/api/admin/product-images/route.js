import { NextResponse } from "next/server";
import { getAdminSession, getAdminUnauthorizedResponse } from "../../../../lib/admin-session";
import { canStoreProductImages, storeProductImage } from "../../../../lib/product-image-store";

const MAX_FILES_PER_UPLOAD = 20;
const MAX_SOURCE_FILE_SIZE = 4 * 1024 * 1024;

export const runtime = "nodejs";

export async function POST(request) {
    const session = await getAdminSession();
    if (!session) {
        return getAdminUnauthorizedResponse();
    }

    if (!canStoreProductImages()) {
        return NextResponse.json(
            {
                ok: false,
                message: "O upload de imagens não está configurado neste ambiente.",
            },
            { status: 503 }
        );
    }

    try {
        const formData = await request.formData();
        const files = formData
            .getAll("files")
            .filter((value) => value instanceof File && value.size > 0)
            .slice(0, MAX_FILES_PER_UPLOAD);

        if (!files.length) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "Nenhuma imagem válida foi enviada.",
                },
                { status: 400 }
            );
        }

        const oversizedFile = files.find((file) => file.size > MAX_SOURCE_FILE_SIZE);

        if (oversizedFile) {
            return NextResponse.json(
                {
                    ok: false,
                    message: `A imagem ${oversizedFile.name} excede o limite permitido para upload.`,
                },
                { status: 413 }
            );
        }

        const images = await Promise.all(files.map((file) => storeProductImage(file)));

        return NextResponse.json({
            ok: true,
            images,
        });
    } catch (error) {
        console.log("[AdminProductImages] Failed to upload product images.", error);
        return NextResponse.json(
            {
                ok: false,
                message: "Não foi possível enviar as imagens do produto.",
            },
            { status: 500 }
        );
    }
}
