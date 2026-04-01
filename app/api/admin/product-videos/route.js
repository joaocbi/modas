import { NextResponse } from "next/server";
import { getAdminSession, getAdminUnauthorizedResponse } from "../../../../lib/admin-session";
import { canStoreProductVideos, storeProductVideo } from "../../../../lib/product-image-store";

const MAX_FILES_PER_UPLOAD = 4;
const MAX_SOURCE_FILE_SIZE = 350 * 1024 * 1024;

export const runtime = "nodejs";

export async function POST(request) {
    const session = await getAdminSession();
    if (!session) {
        return getAdminUnauthorizedResponse();
    }

    if (!canStoreProductVideos()) {
        return NextResponse.json(
            {
                ok: false,
                message: "O upload de vídeos não está configurado neste ambiente.",
            },
            { status: 503 }
        );
    }

    try {
        const formData = await request.formData();
        const files = formData
            .getAll("files")
            .filter((value) => value instanceof File && value.size > 0 && String(value.type || "").startsWith("video/"))
            .slice(0, MAX_FILES_PER_UPLOAD);

        if (!files.length) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "Nenhum vídeo válido foi enviado.",
                },
                { status: 400 }
            );
        }

        const oversizedFile = files.find((file) => file.size > MAX_SOURCE_FILE_SIZE);

        if (oversizedFile) {
            return NextResponse.json(
                {
                    ok: false,
                    message: `O vídeo ${oversizedFile.name} excede o limite permitido para upload.`,
                },
                { status: 413 }
            );
        }

        const videos = await Promise.all(files.map((file) => storeProductVideo(file)));

        return NextResponse.json({
            ok: true,
            videos,
        });
    } catch (error) {
        console.log("[AdminProductVideos] Failed to upload product videos.", error);
        return NextResponse.json(
            {
                ok: false,
                message: "Não foi possível enviar os vídeos do produto.",
            },
            { status: 500 }
        );
    }
}
