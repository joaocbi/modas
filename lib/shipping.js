export const FREE_SHIPPING_THRESHOLD = 800;
export const SEDEX_SHIPPING_PRICE = 46;

export function calculateShippingAmount(subtotal) {
    const normalizedSubtotal = Number(subtotal || 0);
    return normalizedSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SEDEX_SHIPPING_PRICE;
}

export function calculateRemainingForFreeShipping(subtotal) {
    const normalizedSubtotal = Number(subtotal || 0);
    return Math.max(0, Number((FREE_SHIPPING_THRESHOLD - normalizedSubtotal).toFixed(2)));
}

