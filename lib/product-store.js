import { promises as fs } from "node:fs";
import path from "node:path";
import { prisma } from "./prisma";

const productsFilePath = path.join(process.cwd(), "data", "products.json");

function hasDatabaseUrl() {
    return Boolean(process.env.DATABASE_URL);
}

export function getStorageMode() {
    return hasDatabaseUrl() ? "database" : "file";
}

export function isAdminMutationEnabled() {
    return hasDatabaseUrl() || process.env.NODE_ENV !== "production";
}

function normalizeArrayValue(value) {
    if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter(Boolean);
    }

    return String(value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

function normalizeProduct(product, id) {
    return {
        id,
        name: String(product.name || "").trim(),
        description: String(product.description || "").trim(),
        category: String(product.category || "").trim(),
        sizes: normalizeArrayValue(product.sizes),
        colors: normalizeArrayValue(product.colors),
        price: Number(product.price || 0),
        oldPrice: Number(product.oldPrice || 0),
        badge: String(product.badge || "").trim(),
        image: String(product.image || "").trim() || "/assets/product_1.jpg",
        featured: Boolean(product.featured),
    };
}

function mapDatabaseProduct(product) {
    return {
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        sizes: product.sizes,
        colors: product.colors,
        price: Number(product.price),
        oldPrice: Number(product.oldPrice),
        badge: product.badge,
        image: product.image,
        featured: product.featured,
    };
}

export async function getAllProducts() {
    if (hasDatabaseUrl()) {
        const products = await prisma.product.findMany({
            orderBy: {
                id: "asc",
            },
        });
        console.log("[ProductStore] Loaded products from database.", { count: products.length });
        return products.map(mapDatabaseProduct);
    }

    const fileContents = await fs.readFile(productsFilePath, "utf8");
    const parsedProducts = JSON.parse(fileContents);
    console.log("[ProductStore] Loaded products from file fallback.", { count: parsedProducts.length });
    return parsedProducts;
}

async function saveProducts(products) {
    await fs.writeFile(productsFilePath, JSON.stringify(products, null, 2), "utf8");
    console.log("[ProductStore] Saved products.", { count: products.length });
}

export async function createProduct(input) {
    if (!isAdminMutationEnabled()) {
        throw new Error("DATABASE_URL is required for admin writes in production.");
    }

    if (hasDatabaseUrl()) {
        const product = normalizeProduct(input, undefined);
        const createdProduct = await prisma.product.create({
            data: {
                name: product.name,
                description: product.description,
                category: product.category,
                sizes: product.sizes,
                colors: product.colors,
                price: product.price,
                oldPrice: product.oldPrice,
                badge: product.badge,
                image: product.image,
                featured: product.featured,
            },
        });
        console.log("[ProductStore] Created product in database.", { id: createdProduct.id });
        return mapDatabaseProduct(createdProduct);
    }

    const products = await getAllProducts();
    const nextId = products.reduce((largestId, product) => Math.max(largestId, Number(product.id) || 0), 0) + 1;
    const product = normalizeProduct(input, nextId);
    const nextProducts = [...products, product];
    await saveProducts(nextProducts);
    return product;
}

export async function updateProduct(id, input) {
    if (!isAdminMutationEnabled()) {
        throw new Error("DATABASE_URL is required for admin writes in production.");
    }

    if (hasDatabaseUrl()) {
        const normalizedId = Number(id);
        const product = normalizeProduct(input, normalizedId);
        const updatedProduct = await prisma.product.update({
            where: {
                id: normalizedId,
            },
            data: {
                name: product.name,
                description: product.description,
                category: product.category,
                sizes: product.sizes,
                colors: product.colors,
                price: product.price,
                oldPrice: product.oldPrice,
                badge: product.badge,
                image: product.image,
                featured: product.featured,
            },
        });
        console.log("[ProductStore] Updated product in database.", { id: normalizedId });
        return mapDatabaseProduct(updatedProduct);
    }

    const products = await getAllProducts();
    const normalizedId = Number(id);
    const productIndex = products.findIndex((product) => Number(product.id) === normalizedId);

    if (productIndex < 0) {
        throw new Error("Product not found.");
    }

    const updatedProduct = normalizeProduct({ ...products[productIndex], ...input }, normalizedId);
    const nextProducts = [...products];
    nextProducts[productIndex] = updatedProduct;
    await saveProducts(nextProducts);
    return updatedProduct;
}

export async function deleteProduct(id) {
    if (!isAdminMutationEnabled()) {
        throw new Error("DATABASE_URL is required for admin writes in production.");
    }

    if (hasDatabaseUrl()) {
        const normalizedId = Number(id);
        await prisma.product.delete({
            where: {
                id: normalizedId,
            },
        });
        console.log("[ProductStore] Deleted product from database.", { id: normalizedId });
        return;
    }

    const products = await getAllProducts();
    const normalizedId = Number(id);
    const nextProducts = products.filter((product) => Number(product.id) !== normalizedId);

    if (nextProducts.length === products.length) {
        throw new Error("Product not found.");
    }

    await saveProducts(nextProducts);
    console.log("[ProductStore] Deleted product.", { id: normalizedId });
}
