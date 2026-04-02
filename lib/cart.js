"use client";

const CART_STORAGE_KEY = "modas-cart";
const CART_UPDATED_EVENT = "modas-cart-updated";

function isBrowser() {
    return typeof window !== "undefined";
}

function normalizeCartItem(item) {
    const productId = Number(item?.productId || 0);
    const quantity = Math.max(1, Number(item?.quantity || 1));
    const selectedSize = String(item?.selectedSize || "").trim();
    const selectedColor = String(item?.selectedColor || "").trim();

    if (!productId) {
        return null;
    }

    return {
        productId,
        quantity,
        selectedSize,
        selectedColor,
    };
}

function dispatchCartUpdated(cartItems) {
    if (!isBrowser()) {
        return;
    }

    window.dispatchEvent(
        new CustomEvent(CART_UPDATED_EVENT, {
            detail: cartItems,
        })
    );
}

export function getCartItems() {
    if (!isBrowser()) {
        return [];
    }

    try {
        const rawValue = window.localStorage.getItem(CART_STORAGE_KEY);
        const parsedValue = JSON.parse(rawValue || "[]");
        const normalizedItems = parsedValue.map(normalizeCartItem).filter(Boolean);
        console.log("[Cart] Loaded cart items.", { count: normalizedItems.length });
        return normalizedItems;
    } catch (error) {
        console.log("[Cart] Failed to read cart from storage.", error);
        return [];
    }
}

export function setCartItems(items) {
    if (!isBrowser()) {
        return [];
    }

    const normalizedItems = items.map(normalizeCartItem).filter(Boolean);
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(normalizedItems));
    console.log("[Cart] Saved cart items.", { count: normalizedItems.length });
    dispatchCartUpdated(normalizedItems);
    return normalizedItems;
}

export function addCartItem(item) {
    const nextItem = normalizeCartItem(item);

    if (!nextItem) {
        return getCartItems();
    }

    const currentItems = getCartItems();
    const existingItemIndex = currentItems.findIndex(
        (currentItem) =>
            currentItem.productId === nextItem.productId &&
            currentItem.selectedSize === nextItem.selectedSize &&
            currentItem.selectedColor === nextItem.selectedColor
    );

    if (existingItemIndex >= 0) {
        const nextItems = [...currentItems];
        nextItems[existingItemIndex] = {
            ...nextItems[existingItemIndex],
            quantity: nextItems[existingItemIndex].quantity + nextItem.quantity,
        };
        return setCartItems(nextItems);
    }

    return setCartItems([...currentItems, nextItem]);
}

export function updateCartItemQuantity(itemKey, quantity) {
    const nextQuantity = Math.max(1, Number(quantity || 1));
    const currentItems = getCartItems();
    const nextItems = currentItems.map((item) =>
        buildCartItemKey(item) === itemKey
            ? {
                  ...item,
                  quantity: nextQuantity,
              }
            : item
    );

    return setCartItems(nextItems);
}

export function removeCartItem(itemKey) {
    const currentItems = getCartItems();
    const nextItems = currentItems.filter((item) => buildCartItemKey(item) !== itemKey);
    return setCartItems(nextItems);
}

export function clearCart() {
    return setCartItems([]);
}

export function buildCartItemKey(item) {
    return [item.productId, item.selectedSize, item.selectedColor].join("::");
}

export function countCartItems(items) {
    return items.reduce((total, item) => total + Number(item.quantity || 0), 0);
}

export function subscribeToCart(listener) {
    if (!isBrowser()) {
        return () => undefined;
    }

    function handleStorage(event) {
        if (event.key && event.key !== CART_STORAGE_KEY) {
            return;
        }

        listener(getCartItems());
    }

    function handleCustomEvent(event) {
        listener(event.detail || getCartItems());
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(CART_UPDATED_EVENT, handleCustomEvent);

    return () => {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener(CART_UPDATED_EVENT, handleCustomEvent);
    };
}
