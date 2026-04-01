function normalizeText(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

export function slugifySegment(value, fallback = "produto") {
    const normalizedValue = normalizeText(value)
        .toLocaleLowerCase("pt-BR")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    return normalizedValue || fallback;
}

export function normalizeIdentifier(value, fallback = "") {
    const normalizedValue = slugifySegment(value, fallback || "item");
    return fallback || value ? normalizedValue : "";
}

export function getPrimaryColorValue(product) {
    const explicitPrimaryColor = String(product?.primaryColor || "").trim();

    if (explicitPrimaryColor) {
        return explicitPrimaryColor;
    }

    if (Array.isArray(product?.colors) && product.colors.length) {
        return String(product.colors[0] || "").trim();
    }

    return "";
}

export function getDefaultVariationGroupId(product, idFallback = "") {
    const explicitGroupId = normalizeIdentifier(product?.variationGroupId || "");

    if (explicitGroupId) {
        return explicitGroupId;
    }

    const nameSegment = slugifySegment(product?.name || idFallback || "produto");
    const categorySegment = slugifySegment(product?.category || "catalogo");
    return `${categorySegment}-${nameSegment}`;
}

export function getDefaultProductSlug(product, idFallback = "") {
    const explicitSlug = normalizeIdentifier(product?.slug || "");

    if (explicitSlug) {
        return explicitSlug;
    }

    const baseSegments = [product?.name, getPrimaryColorValue(product) || idFallback].filter(Boolean);
    return slugifySegment(baseSegments.join("-"), idFallback ? `produto-${idFallback}` : "produto");
}

export function buildProductPath(product) {
    return `/produtos/${String(product?.slug || "").trim()}`;
}

export function sortProductVariations(products) {
    return [...products].sort((leftProduct, rightProduct) => {
        const leftColor = getPrimaryColorValue(leftProduct);
        const rightColor = getPrimaryColorValue(rightProduct);

        if (leftColor && rightColor && leftColor !== rightColor) {
            return leftColor.localeCompare(rightColor, "pt-BR", { sensitivity: "base" });
        }

        return String(leftProduct?.name || "").localeCompare(String(rightProduct?.name || ""), "pt-BR", { sensitivity: "base" });
    });
}
