import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { put } from "@vercel/blob";

const localUploadDirectory = path.join(process.cwd(), "public", "uploads", "products");

function hasBlobToken() {
    return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function sanitizeFileNameSegment(value) {
    return String(value || "produto")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 50) || "produto";
}

function getFileExtension(file) {
    const fileName = String(file?.name || "");
    const extensionFromName = fileName.includes(".") ? fileName.split(".").pop() : "";

    if (extensionFromName) {
        return extensionFromName.toLowerCase();
    }

    const type = String(file?.type || "").toLowerCase();

    if (type === "image/webp") {
        return "webp";
    }

    if (type === "image/png") {
        return "png";
    }

    if (type === "image/jpeg") {
        return "jpg";
    }

    return "bin";
}

function buildStorageFileName(file) {
    const rawName = String(file?.name || "").replace(/\.[^.]+$/, "");
    const baseName = sanitizeFileNameSegment(rawName);
    const extension = getFileExtension(file);
    return `${Date.now()}-${randomUUID()}-${baseName}.${extension}`;
}

export function canStoreProductImages() {
    return hasBlobToken() || process.env.NODE_ENV !== "production";
}

export async function storeProductImage(file) {
    const fileName = buildStorageFileName(file);

    if (hasBlobToken()) {
        const blob = await put(`products/${fileName}`, file, {
            access: "public",
            addRandomSuffix: false,
        });

        return blob.url;
    }

    if (process.env.NODE_ENV === "production") {
        throw new Error("BLOB_READ_WRITE_TOKEN is required to upload product images in production.");
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await fs.mkdir(localUploadDirectory, { recursive: true });
    await fs.writeFile(path.join(localUploadDirectory, fileName), fileBuffer);
    return `/uploads/products/${fileName}`;
}
