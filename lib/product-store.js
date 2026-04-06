import { promises as fs } from "node:fs";
import path from "node:path";
import { prisma } from "./prisma";

const productsFilePath = path.join(process.cwd(), "data", "products.json");

const INTERNAL_NOTES_MAX_LENGTH = 1500;

function normalizeInternalNotes(value) {
    return String(value ?? "")
        .slice(0, INTERNAL_NOTES_MAX_LENGTH)
        .trimEnd();
}

function stripInternalNotesFromProduct(product) {
    if (!product || typeof product !== "object") {
        return product;
    }

    const { internalNotes: _ignored, ...publicProduct } = product;
    return publicProduct;
}

function hasDatabaseUrl() {
    return Boolean(process.env.DATABASE_URL);
}

function calculateTotalCost({ price, costPrice, salesFeePercentage }) {
    const normalizedPrice = Number(price || 0);
    const normalizedCostPrice = Number(costPrice || 0);
    const normalizedSalesFeePercentage = Number(salesFeePercentage || 0);

    return Number((normalizedCostPrice + normalizedPrice * (normalizedSalesFeePercentage / 100)).toFixed(2));
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

function normalizePaymentMethods(value) {
    const normalizedValues = normalizeArrayValue(value);
    return normalizedValues.length ? normalizedValues : ["Pix", "Cartão de crédito", "Mercado Pago"];
}

function normalizeImageList(value, fallbackImage) {
    const imageCandidates = Array.isArray(value)
        ? value
        : String(value || "")
              .split("\n")
              .map((item) => item.trim())
              .filter(Boolean);
    const normalizedImages = imageCandidates
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .slice(0, 20);

    if (normalizedImages.length) {
        return normalizedImages;
    }

    const normalizedFallbackImage = String(fallbackImage || "").trim();
    return normalizedFallbackImage ? [normalizedFallbackImage] : ["/assets/product_4.jpg"];
}

function normalizeVideoList(value) {
    const videoCandidates = Array.isArray(value)
        ? value
        : String(value || "")
              .split("\n")
              .map((item) => item.trim())
              .filter(Boolean);

    return videoCandidates
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .slice(0, 4);
}

function normalizeProduct(product, id) {
    const normalizedPrice = Number(product.price || 0);
    const normalizedCostPrice = Number(product.costPrice || 0);
    const normalizedSalesFeePercentage = Number(product.salesFeePercentage || 0);
    const normalizedImages = normalizeImageList(product.images, product.image);
    const normalizedVideos = normalizeVideoList(product.videos);
    const normalizedTotalCost = Number(product.totalCost || calculateTotalCost({
        price: normalizedPrice,
        costPrice: normalizedCostPrice,
        salesFeePercentage: normalizedSalesFeePercentage,
    }));

    return {
        id,
        name: String(product.name || "").trim(),
        description: String(product.description || "").trim(),
        category: String(product.category || "").trim(),
        subcategory: String(product.subcategory || "").trim(),
        sizes: normalizeArrayValue(product.sizes),
        colors: normalizeArrayValue(product.colors),
        paymentMethods: normalizePaymentMethods(product.paymentMethods),
        price: normalizedPrice,
        oldPrice: Number(product.oldPrice || 0),
        costPrice: normalizedCostPrice,
        salesFeePercentage: normalizedSalesFeePercentage,
        totalCost: normalizedTotalCost,
        mercadoPagoEnabled: Boolean(product.mercadoPagoEnabled),
        mercadoPagoLink: String(product.mercadoPagoLink || "").trim(),
        badge: String(product.badge || "").trim(),
        image: normalizedImages[0] || "/assets/product_4.jpg",
        images: normalizedImages,
        videos: normalizedVideos,
        featured: Boolean(product.featured),
        internalNotes: normalizeInternalNotes(product.internalNotes),
    };
}

function mapDatabaseProduct(product) {
    const normalizedImages = normalizeImageList(product.images, product.image);
    const normalizedVideos = normalizeVideoList(product.videos);

    return {
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        subcategory: product.subcategory,
        sizes: product.sizes,
        colors: product.colors,
        paymentMethods: product.paymentMethods,
        price: Number(product.price),
        oldPrice: Number(product.oldPrice),
        costPrice: Number(product.costPrice),
        salesFeePercentage: Number(product.salesFeePercentage),
        totalCost: Number(product.totalCost),
        mercadoPagoEnabled: product.mercadoPagoEnabled,
        mercadoPagoLink: product.mercadoPagoLink,
        badge: product.badge,
        image: normalizedImages[0],
        images: normalizedImages,
        videos: normalizedVideos,
        featured: product.featured,
        internalNotes: normalizeInternalNotes(product.internalNotes),
    };
}

export async function getAllProducts(options = {}) {
    const forPublicStorefront = Boolean(options.forPublicStorefront);

    if (hasDatabaseUrl()) {
        const products = await prisma.product.findMany({
            orderBy: {
                createdAt: "desc",
            },
        });
        console.log("[ProductStore] Loaded products from database.", { count: products.length });
        const mapped = products.map(mapDatabaseProduct);
        return forPublicStorefront ? mapped.map(stripInternalNotesFromProduct) : mapped;
    }

    const fileContents = await fs.readFile(productsFilePath, "utf8");
    const parsedProducts = JSON.parse(fileContents);
    console.log("[ProductStore] Loaded products from file fallback.", { count: parsedProducts.length });
    const normalized = parsedProducts
        .map((product) => normalizeProduct(product, Number(product.id)))
        .sort((leftProduct, rightProduct) => Number(rightProduct.id) - Number(leftProduct.id));
    return forPublicStorefront ? normalized.map(stripInternalNotesFromProduct) : normalized;
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
                subcategory: product.subcategory,
                sizes: product.sizes,
                colors: product.colors,
                paymentMethods: product.paymentMethods,
                price: product.price,
                oldPrice: product.oldPrice,
                costPrice: product.costPrice,
                salesFeePercentage: product.salesFeePercentage,
                totalCost: product.totalCost,
                mercadoPagoEnabled: product.mercadoPagoEnabled,
                mercadoPagoLink: product.mercadoPagoLink,
                badge: product.badge,
                image: product.image,
                images: product.images,
                videos: product.videos,
                featured: product.featured,
                internalNotes: product.internalNotes,
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
                subcategory: product.subcategory,
                sizes: product.sizes,
                colors: product.colors,
                paymentMethods: product.paymentMethods,
                price: product.price,
                oldPrice: product.oldPrice,
                costPrice: product.costPrice,
                salesFeePercentage: product.salesFeePercentage,
                totalCost: product.totalCost,
                mercadoPagoEnabled: product.mercadoPagoEnabled,
                mercadoPagoLink: product.mercadoPagoLink,
                badge: product.badge,
                image: product.image,
                images: product.images,
                videos: product.videos,
                featured: product.featured,
                internalNotes: product.internalNotes,
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

export async function renameProductsCategory(currentCategoryName, nextCategoryName) {
    if (!isAdminMutationEnabled()) {
        throw new Error("DATABASE_URL is required for admin writes in production.");
    }

    const normalizedCurrentCategoryName = String(currentCategoryName || "").trim();
    const normalizedNextCategoryName = String(nextCategoryName || "").trim();

    if (!normalizedCurrentCategoryName || !normalizedNextCategoryName || normalizedCurrentCategoryName === normalizedNextCategoryName) {
        return;
    }

    if (hasDatabaseUrl()) {
        await prisma.product.updateMany({
            where: {
                category: normalizedCurrentCategoryName,
            },
            data: {
                category: normalizedNextCategoryName,
            },
        });
        return;
    }

    const products = await getAllProducts();
    const nextProducts = products.map((product) =>
        String(product.category || "").trim() === normalizedCurrentCategoryName
            ? {
                  ...product,
                  category: normalizedNextCategoryName,
              }
            : product
    );
    await saveProducts(nextProducts);
}

export async function renameProductsSubcategory(categoryName, currentSubcategoryName, nextSubcategoryName) {
    if (!isAdminMutationEnabled()) {
        throw new Error("DATABASE_URL is required for admin writes in production.");
    }

    const normalizedCategoryName = String(categoryName || "").trim();
    const normalizedCurrentSubcategoryName = String(currentSubcategoryName || "").trim();
    const normalizedNextSubcategoryName = String(nextSubcategoryName || "").trim();

    if (
        !normalizedCategoryName ||
        !normalizedCurrentSubcategoryName ||
        !normalizedNextSubcategoryName ||
        normalizedCurrentSubcategoryName === normalizedNextSubcategoryName
    ) {
        return;
    }

    if (hasDatabaseUrl()) {
        await prisma.product.updateMany({
            where: {
                category: normalizedCategoryName,
                subcategory: normalizedCurrentSubcategoryName,
            },
            data: {
                subcategory: normalizedNextSubcategoryName,
            },
        });
        return;
    }

    const products = await getAllProducts();
    const nextProducts = products.map((product) =>
        String(product.category || "").trim() === normalizedCategoryName &&
        String(product.subcategory || "").trim() === normalizedCurrentSubcategoryName
            ? {
                  ...product,
                  subcategory: normalizedNextSubcategoryName,
              }
            : product
    );
    await saveProducts(nextProducts);
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
