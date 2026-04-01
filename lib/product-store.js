import { promises as fs } from "node:fs";
import path from "node:path";
import { prisma } from "./prisma";
import { getDefaultProductSlug, getDefaultVariationGroupId, getPrimaryColorValue, sortProductVariations } from "./product-utils";

const productsFilePath = path.join(process.cwd(), "data", "products.json");

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
        .slice(0, 12);

    if (normalizedImages.length) {
        return normalizedImages;
    }

    const normalizedFallbackImage = String(fallbackImage || "").trim();
    return normalizedFallbackImage ? [normalizedFallbackImage] : ["/assets/product_1.jpg"];
}

function normalizeProductIdentity(product, id) {
    const primaryColor = getPrimaryColorValue(product);

    return {
        primaryColor,
        variationGroupId: getDefaultVariationGroupId(product, id),
        slug: getDefaultProductSlug({ ...product, primaryColor }, id),
    };
}

function ensureUniqueProductSlug(products, slug, currentProductId) {
    const normalizedBaseSlug = String(slug || "").trim() || "produto";
    const existingSlugs = new Set(
        (products || [])
            .filter((product) => Number(product.id) !== Number(currentProductId))
            .map((product) => String(product.slug || "").trim())
            .filter(Boolean)
    );

    let nextSlug = normalizedBaseSlug;
    let counter = 2;

    while (existingSlugs.has(nextSlug)) {
        nextSlug = `${normalizedBaseSlug}-${counter}`;
        counter += 1;
    }

    return nextSlug;
}

function hydrateProductCatalog(products) {
    const hydratedProducts = [];

    for (const product of products) {
        const identity = normalizeProductIdentity(product, product.id);
        hydratedProducts.push({
            ...product,
            primaryColor: identity.primaryColor,
            variationGroupId: identity.variationGroupId,
            slug: ensureUniqueProductSlug(hydratedProducts, identity.slug, product.id),
        });
    }

    return hydratedProducts;
}

function normalizeProduct(product, id) {
    const normalizedPrice = Number(product.price || 0);
    const normalizedCostPrice = Number(product.costPrice || 0);
    const normalizedSalesFeePercentage = Number(product.salesFeePercentage || 0);
    const normalizedImages = normalizeImageList(product.images, product.image);
    const normalizedTotalCost = Number(product.totalCost || calculateTotalCost({
        price: normalizedPrice,
        costPrice: normalizedCostPrice,
        salesFeePercentage: normalizedSalesFeePercentage,
    }));
    const identity = normalizeProductIdentity({ ...product, colors: normalizeArrayValue(product.colors) }, id);

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
        image: normalizedImages[0] || "/assets/product_1.jpg",
        images: normalizedImages,
        featured: Boolean(product.featured),
        slug: identity.slug,
        variationGroupId: identity.variationGroupId,
        primaryColor: identity.primaryColor,
    };
}

function mapDatabaseProduct(product) {
    const normalizedImages = normalizeImageList(product.images, product.image);

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
        featured: product.featured,
        slug: String(product.slug || "").trim(),
        variationGroupId: String(product.variationGroupId || "").trim(),
        primaryColor: String(product.primaryColor || "").trim(),
    };
}

export async function getAllProducts() {
    if (hasDatabaseUrl()) {
        const products = await prisma.product.findMany({
            orderBy: {
                createdAt: "desc",
            },
        });
        console.log("[ProductStore] Loaded products from database.", { count: products.length });
        return hydrateProductCatalog(products.map(mapDatabaseProduct));
    }

    const fileContents = await fs.readFile(productsFilePath, "utf8");
    const parsedProducts = JSON.parse(fileContents);
    console.log("[ProductStore] Loaded products from file fallback.", { count: parsedProducts.length });
    return hydrateProductCatalog(
        parsedProducts
            .map((product) => normalizeProduct(product, Number(product.id)))
            .sort((leftProduct, rightProduct) => Number(rightProduct.id) - Number(leftProduct.id))
    );
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
        const existingProducts = await getAllProducts();
        const product = normalizeProduct(input, undefined);
        const nextSlug = ensureUniqueProductSlug(existingProducts, product.slug);
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
                featured: product.featured,
                slug: nextSlug,
                variationGroupId: product.variationGroupId,
                primaryColor: product.primaryColor,
            },
        });
        console.log("[ProductStore] Created product in database.", { id: createdProduct.id });
        return mapDatabaseProduct(createdProduct);
    }

    const products = await getAllProducts();
    const nextId = products.reduce((largestId, product) => Math.max(largestId, Number(product.id) || 0), 0) + 1;
    const product = normalizeProduct(input, nextId);
    const nextProducts = [...products, { ...product, slug: ensureUniqueProductSlug(products, product.slug, nextId) }];
    await saveProducts(nextProducts);
    return nextProducts[nextProducts.length - 1];
}

export async function updateProduct(id, input) {
    if (!isAdminMutationEnabled()) {
        throw new Error("DATABASE_URL is required for admin writes in production.");
    }

    if (hasDatabaseUrl()) {
        const normalizedId = Number(id);
        const existingProducts = await getAllProducts();
        const product = normalizeProduct(input, normalizedId);
        const nextSlug = ensureUniqueProductSlug(existingProducts, product.slug, normalizedId);
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
                featured: product.featured,
                slug: nextSlug,
                variationGroupId: product.variationGroupId,
                primaryColor: product.primaryColor,
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
    nextProducts[productIndex] = {
        ...updatedProduct,
        slug: ensureUniqueProductSlug(products, updatedProduct.slug, normalizedId),
    };
    await saveProducts(nextProducts);
    return nextProducts[productIndex];
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

export async function getProductBySlug(slug) {
    const normalizedSlug = String(slug || "").trim().toLocaleLowerCase("pt-BR");

    if (!normalizedSlug) {
        return null;
    }

    const products = await getAllProducts();
    return products.find((product) => String(product.slug || "").trim().toLocaleLowerCase("pt-BR") === normalizedSlug) || null;
}

export async function getProductVariations(product) {
    const normalizedGroupId = String(product?.variationGroupId || "").trim();

    if (!normalizedGroupId) {
        return product ? [product] : [];
    }

    const products = await getAllProducts();
    const variations = products.filter((catalogProduct) => String(catalogProduct.variationGroupId || "").trim() === normalizedGroupId);
    return sortProductVariations(variations);
}
