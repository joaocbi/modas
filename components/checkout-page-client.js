"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildCartItemKey, clearCart, countCartItems, getCartItems, removeCartItem, setCartItems, subscribeToCart, updateCartItemQuantity } from "../lib/cart";

function formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(value || 0));
}

function sanitizeDocument(value) {
    return String(value || "").replace(/\D+/g, "");
}

function resolveCartProducts(products, cartItems) {
    const productMap = new Map(products.map((product) => [Number(product.id), product]));

    return cartItems
        .map((item) => {
            const product = productMap.get(Number(item.productId));

            if (!product) {
                return null;
            }

            return {
                ...item,
                product,
                key: buildCartItemKey(item),
                subtotal: Number((Number(product.price || 0) * Number(item.quantity || 0)).toFixed(2)),
            };
        })
        .filter(Boolean);
}

function shouldClearCartAfterPayment(status) {
    return ["approved", "authorized"].includes(String(status || "").trim().toLowerCase());
}

function getStatusMessage(payment) {
    const normalizedStatus = String(payment?.status || "").trim().toLowerCase();

    if (normalizedStatus === "approved") {
        return "Payment approved successfully.";
    }

    if (normalizedStatus === "pending") {
        return payment?.method === "pix"
            ? "Pix generated successfully. Finish the payment with the QR code below."
            : "Payment created and waiting for confirmation.";
    }

    if (normalizedStatus === "in_process" || normalizedStatus === "authorized") {
        return "Payment is being reviewed by Mercado Pago.";
    }

    if (normalizedStatus === "rejected") {
        return "Payment was rejected. Please review the data and try again.";
    }

    return "Payment processed. Track the order status in the admin panel.";
}

export function CheckoutPageClient({
    initialProducts,
    buyNowProductId = null,
    buyNowSize = "",
    buyNowColor = "",
}) {
    const [cartItems, setCartState] = useState([]);
    const [paymentConfig, setPaymentConfig] = useState({
        enabled: false,
        publicKey: "",
        cardEnabled: false,
        pixEnabled: false,
    });
    const [paymentMethod, setPaymentMethod] = useState("pix");
    const [isLoadingConfig, setIsLoadingConfig] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [copiedPixCode, setCopiedPixCode] = useState(false);
    const [paymentResult, setPaymentResult] = useState(null);
    const [sdkReady, setSdkReady] = useState(false);
    const [cardFormReady, setCardFormReady] = useState(false);
    const [customer, setCustomer] = useState({
        name: "",
        email: "",
        phone: "",
        cpf: "",
    });
    const customerRef = useRef(customer);
    const cardFormRef = useRef(null);

    useEffect(() => {
        customerRef.current = customer;
    }, [customer]);

    useEffect(() => {
        const storedItems = getCartItems();
        setCartState(storedItems);

        const unsubscribe = subscribeToCart((nextItems) => {
            setCartState(nextItems);
        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        if (!buyNowProductId) {
            return;
        }

        const product = initialProducts.find((currentProduct) => Number(currentProduct.id) === Number(buyNowProductId));

        if (!product) {
            return;
        }

        const selectedSize = String(buyNowSize || product.sizes?.[0] || "").trim();
        const selectedColor = String(buyNowColor || product.colors?.[0] || "").trim();
        const nextItems = [
            {
                productId: Number(product.id),
                quantity: 1,
                selectedSize,
                selectedColor,
            },
        ];

        console.log("[Checkout] Buy now flow started.", {
            productId: product.id,
            selectedSize,
            selectedColor,
        });
        setCartItems(nextItems);
        setCartState(nextItems);
    }, [buyNowColor, buyNowProductId, buyNowSize, initialProducts]);

    useEffect(() => {
        let isCancelled = false;

        async function loadPaymentConfig() {
            try {
                const response = await fetch("/api/payments/mercado-pago/config", {
                    cache: "no-store",
                });
                const data = await response.json();

                if (isCancelled) {
                    return;
                }

                if (!response.ok || !data.ok) {
                    throw new Error(data.message || "Unable to load Mercado Pago configuration.");
                }

                setPaymentConfig({
                    enabled: Boolean(data.enabled),
                    publicKey: String(data.publicKey || "").trim(),
                    cardEnabled: Boolean(data.cardEnabled),
                    pixEnabled: Boolean(data.pixEnabled),
                });

                if (!data.pixEnabled && data.cardEnabled) {
                    setPaymentMethod("card");
                }

                console.log("[Checkout] Payment config loaded.", data);
            } catch (error) {
                console.log("[Checkout] Failed to load payment config.", error);
                if (!isCancelled) {
                    setErrorMessage("Mercado Pago is not configured yet. Add the payment keys to enable checkout.");
                }
            } finally {
                if (!isCancelled) {
                    setIsLoadingConfig(false);
                }
            }
        }

        loadPaymentConfig();

        return () => {
            isCancelled = true;
        };
    }, []);

    const resolvedItems = useMemo(() => resolveCartProducts(initialProducts, cartItems), [initialProducts, cartItems]);
    const totalAmount = useMemo(
        () => Number(resolvedItems.reduce((total, item) => total + item.subtotal, 0).toFixed(2)),
        [resolvedItems]
    );
    const totalItems = useMemo(() => countCartItems(cartItems), [cartItems]);
    const cartFingerprint = useMemo(
        () => resolvedItems.map((item) => `${item.key}:${item.quantity}`).join("|"),
        [resolvedItems]
    );

    useEffect(() => {
        if (
            paymentMethod !== "card" ||
            !paymentConfig.cardEnabled ||
            !sdkReady ||
            !resolvedItems.length ||
            typeof window === "undefined" ||
            !window.MercadoPago
        ) {
            return undefined;
        }

        setCardFormReady(false);
        setErrorMessage("");
        cardFormRef.current?.unmount?.();

        console.log("[Checkout] Initializing Mercado Pago card form.", {
            totalAmount,
            cartFingerprint,
        });

        const mercadoPago = new window.MercadoPago(paymentConfig.publicKey, {
            locale: "pt-BR",
        });

        const cardForm = mercadoPago.cardForm({
            amount: totalAmount.toFixed(2),
            autoMount: true,
            form: {
                id: "checkout-card-form",
                cardholderName: {
                    id: "form-checkout__cardholderName",
                },
                cardholderEmail: {
                    id: "form-checkout__cardholderEmail",
                },
                cardNumber: {
                    id: "form-checkout__cardNumber",
                },
                expirationDate: {
                    id: "form-checkout__expirationDate",
                },
                securityCode: {
                    id: "form-checkout__securityCode",
                },
                installments: {
                    id: "form-checkout__installments",
                },
                identificationType: {
                    id: "form-checkout__identificationType",
                },
                identificationNumber: {
                    id: "form-checkout__identificationNumber",
                },
                issuer: {
                    id: "form-checkout__issuer",
                },
            },
            callbacks: {
                onFormMounted: (error) => {
                    if (error) {
                        console.log("[Checkout] Failed to mount card form.", error);
                        setErrorMessage("Unable to load the card form right now.");
                        return;
                    }

                    console.log("[Checkout] Card form mounted.");
                    setCardFormReady(true);
                },
                onSubmit: async (event) => {
                    event.preventDefault();

                    const formData = cardForm.getCardFormData();
                    await submitPayment("card", {
                        token: formData.token,
                        issuerId: formData.issuerId,
                        paymentMethodId: formData.paymentMethodId,
                        installments: formData.installments,
                    });
                },
                onError: (error) => {
                    console.log("[Checkout] Card form error.", error);
                    setErrorMessage("Please review the card data and try again.");
                },
                onFetching: (resource) => {
                    console.log("[Checkout] Card form fetching resource.", { resource });
                },
            },
        });

        cardFormRef.current = cardForm;

        return () => {
            cardFormRef.current?.unmount?.();
            cardFormRef.current = null;
            setCardFormReady(false);
        };
    }, [cartFingerprint, paymentConfig.cardEnabled, paymentConfig.publicKey, paymentMethod, resolvedItems.length, sdkReady, totalAmount]);

    function updateCustomerField(fieldName, value) {
        setCustomer((currentValue) => ({
            ...currentValue,
            [fieldName]: value,
        }));
    }

    function validateCustomer() {
        const normalizedName = String(customerRef.current.name || "").trim();
        const normalizedEmail = String(customerRef.current.email || "").trim();
        const normalizedPhone = String(customerRef.current.phone || "").trim();
        const normalizedCpf = sanitizeDocument(customerRef.current.cpf);

        if (!normalizedName || !normalizedEmail || !normalizedPhone || normalizedCpf.length !== 11) {
            setErrorMessage("Fill in name, email, phone and a valid CPF before continuing.");
            return false;
        }

        return true;
    }

    async function submitPayment(method, cardPayload = null) {
        if (!resolvedItems.length) {
            setErrorMessage("Your cart is empty.");
            return;
        }

        if (!validateCustomer()) {
            return;
        }

        setIsSubmitting(true);
        setStatusMessage("");
        setErrorMessage("");
        setCopiedPixCode(false);

        try {
            const response = await fetch("/api/payments/mercado-pago/payment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    paymentMethod: method,
                    customer: {
                        ...customerRef.current,
                        cpf: sanitizeDocument(customerRef.current.cpf),
                    },
                    items: resolvedItems.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        selectedSize: item.selectedSize,
                        selectedColor: item.selectedColor,
                    })),
                    card: cardPayload,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.ok) {
                throw new Error(data.message || "Unable to create the payment.");
            }

            console.log("[Checkout] Payment created.", data);
            setPaymentResult(data);
            setStatusMessage(getStatusMessage(data.payment));

            if (shouldClearCartAfterPayment(data.payment.status)) {
                clearCart();
                setCartState([]);
            }
        } catch (error) {
            console.log("[Checkout] Payment request failed.", error);
            setErrorMessage(error.message || "Unable to complete the payment.");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function copyPixCode() {
        if (!paymentResult?.payment?.qrCode) {
            return;
        }

        try {
            await navigator.clipboard.writeText(paymentResult.payment.qrCode);
            setCopiedPixCode(true);
            console.log("[Checkout] Pix code copied to clipboard.");
        } catch (error) {
            console.log("[Checkout] Failed to copy Pix code.", error);
            setErrorMessage("Unable to copy the Pix code automatically.");
        }
    }

    return (
        <>
            <Script src="https://sdk.mercadopago.com/js/v2" strategy="afterInteractive" onLoad={() => setSdkReady(true)} />

            <section className="section narrow-section">
                <div className="section-heading align-center">
                    <p className="section-kicker">Secure checkout</p>
                    <h1>Finish your order with Pix or card</h1>
                    <p>Choose the products, confirm your customer data and pay directly on the site with Mercado Pago.</p>
                </div>

                {!resolvedItems.length ? (
                    <div className="empty-state">
                        <h1>Your cart is empty right now</h1>
                        <p>Add products from the catalog to generate the payment on this page.</p>
                        <div className="section-actions">
                            <Link href="/produtos" className="primary-button">
                                View products
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="checkout-layout">
                        <div className="checkout-main">
                            <article className="content-card checkout-card">
                                <div className="checkout-card-header">
                                    <div>
                                        <p className="section-kicker">Customer data</p>
                                        <h2>Billing details</h2>
                                    </div>
                                    <span className="checkout-chip">{totalItems} item(s)</span>
                                </div>

                                <div className="form-grid">
                                    <label className="field">
                                        <span>Full name</span>
                                        <input value={customer.name} onChange={(event) => updateCustomerField("name", event.target.value)} placeholder="Customer full name" />
                                    </label>

                                    <label className="field">
                                        <span>Email</span>
                                        <input type="email" value={customer.email} onChange={(event) => updateCustomerField("email", event.target.value)} placeholder="customer@email.com" />
                                    </label>

                                    <label className="field">
                                        <span>Phone</span>
                                        <input value={customer.phone} onChange={(event) => updateCustomerField("phone", event.target.value)} placeholder="(11) 99999-9999" />
                                    </label>

                                    <label className="field">
                                        <span>CPF</span>
                                        <input value={customer.cpf} onChange={(event) => updateCustomerField("cpf", event.target.value)} placeholder="000.000.000-00" />
                                    </label>
                                </div>
                            </article>

                            <article className="content-card checkout-card">
                                <div className="checkout-card-header">
                                    <div>
                                        <p className="section-kicker">Payment</p>
                                        <h2>Choose how to pay</h2>
                                    </div>
                                </div>

                                <div className="payment-toggle">
                                    <button
                                        type="button"
                                        className={`payment-toggle-button ${paymentMethod === "pix" ? "is-active" : ""}`}
                                        onClick={() => setPaymentMethod("pix")}
                                        disabled={!paymentConfig.pixEnabled || isSubmitting}
                                    >
                                        Pix
                                    </button>
                                    <button
                                        type="button"
                                        className={`payment-toggle-button ${paymentMethod === "card" ? "is-active" : ""}`}
                                        onClick={() => setPaymentMethod("card")}
                                        disabled={!paymentConfig.cardEnabled || isSubmitting}
                                    >
                                        Credit card
                                    </button>
                                </div>

                                {isLoadingConfig ? <p className="checkout-helper">Loading payment configuration...</p> : null}
                                {!paymentConfig.enabled && !isLoadingConfig ? (
                                    <p className="checkout-helper checkout-helper-error">
                                        Mercado Pago keys are missing. Add `MERCADO_PAGO_ACCESS_TOKEN` and `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY` to enable checkout.
                                    </p>
                                ) : null}

                                {statusMessage ? <div className="checkout-alert checkout-alert-success">{statusMessage}</div> : null}
                                {errorMessage ? <div className="checkout-alert checkout-alert-error">{errorMessage}</div> : null}

                                {paymentMethod === "pix" ? (
                                    <div className="payment-panel">
                                        <p className="checkout-helper">Generate the Pix charge and show the QR code immediately after the order is created.</p>
                                        <button type="button" className="primary-button" onClick={() => submitPayment("pix")} disabled={isSubmitting || !paymentConfig.pixEnabled}>
                                            {isSubmitting ? "Generating Pix..." : "Generate Pix"}
                                        </button>

                                        {paymentResult?.payment?.method === "pix" && paymentResult.payment.qrCode ? (
                                            <div className="pix-result-card">
                                                {paymentResult.payment.qrCodeBase64 ? (
                                                    <img
                                                        src={`data:image/png;base64,${paymentResult.payment.qrCodeBase64}`}
                                                        alt="Pix QR code"
                                                        className="pix-qr-image"
                                                    />
                                                ) : null}
                                                <textarea
                                                    className="pix-code-textarea"
                                                    value={paymentResult.payment.qrCode}
                                                    readOnly
                                                    aria-label="Pix code"
                                                />
                                                <div className="section-actions">
                                                    <button type="button" className="secondary-button" onClick={copyPixCode}>
                                                        {copiedPixCode ? "Copied" : "Copy Pix code"}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                ) : (
                                    <div className="payment-panel">
                                        <p className="checkout-helper">The card data is tokenized by Mercado Pago directly in the browser.</p>

                                        <form id="checkout-card-form" className="checkout-card-form">
                                            <input id="form-checkout__cardholderName" type="hidden" value={customer.name} readOnly />
                                            <input id="form-checkout__cardholderEmail" type="hidden" value={customer.email} readOnly />
                                            <select id="form-checkout__identificationType" className="checkout-hidden-field" defaultValue="CPF" aria-hidden="true">
                                                <option value="CPF">CPF</option>
                                            </select>
                                            <input id="form-checkout__identificationNumber" type="hidden" value={sanitizeDocument(customer.cpf)} readOnly />

                                            <div className="form-grid">
                                                <label className="field field-full">
                                                    <span>Card number</span>
                                                    <div id="form-checkout__cardNumber" className="checkout-sdk-field" />
                                                </label>

                                                <label className="field">
                                                    <span>Expiration date</span>
                                                    <div id="form-checkout__expirationDate" className="checkout-sdk-field" />
                                                </label>

                                                <label className="field">
                                                    <span>Security code</span>
                                                    <div id="form-checkout__securityCode" className="checkout-sdk-field" />
                                                </label>

                                                <label className="field">
                                                    <span>Issuer</span>
                                                    <select id="form-checkout__issuer" defaultValue="" />
                                                </label>

                                                <label className="field">
                                                    <span>Installments</span>
                                                    <select id="form-checkout__installments" defaultValue="" />
                                                </label>
                                            </div>

                                            <button type="submit" className="primary-button" disabled={isSubmitting || !cardFormReady || !paymentConfig.cardEnabled}>
                                                {isSubmitting ? "Processing card..." : "Pay with card"}
                                            </button>
                                        </form>

                                        {!sdkReady ? <p className="checkout-helper">Loading Mercado Pago SDK...</p> : null}
                                        {sdkReady && !cardFormReady && paymentConfig.cardEnabled ? (
                                            <p className="checkout-helper">Preparing secure card fields...</p>
                                        ) : null}
                                    </div>
                                )}
                            </article>
                        </div>

                        <aside className="checkout-sidebar">
                            <article className="content-card checkout-card checkout-summary-card">
                                <div className="checkout-card-header">
                                    <div>
                                        <p className="section-kicker">Summary</p>
                                        <h2>Your cart</h2>
                                    </div>
                                </div>

                                <div className="checkout-summary-list">
                                    {resolvedItems.map((item) => (
                                        <div key={item.key} className="checkout-summary-item">
                                            <img src={item.product.image} alt={item.product.name} className="checkout-summary-image" />
                                            <div className="checkout-summary-copy">
                                                <strong>{item.product.name}</strong>
                                                <span>
                                                    {item.selectedColor || "Default color"} • {item.selectedSize || "Default size"}
                                                </span>
                                                <span>{formatCurrency(item.product.price)} each</span>
                                                <div className="checkout-quantity-row">
                                                    <label className="field">
                                                        <span>Qty</span>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={item.quantity}
                                                            onChange={(event) => updateCartItemQuantity(item.key, event.target.value)}
                                                        />
                                                    </label>
                                                    <button type="button" className="text-button" onClick={() => removeCartItem(item.key)}>
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                            <strong>{formatCurrency(item.subtotal)}</strong>
                                        </div>
                                    ))}
                                </div>

                                <div className="checkout-total-row">
                                    <span>Total</span>
                                    <strong>{formatCurrency(totalAmount)}</strong>
                                </div>

                                <div className="section-actions">
                                    <Link href="/produtos" className="secondary-button">
                                        Add more products
                                    </Link>
                                </div>
                            </article>
                        </aside>
                    </div>
                )}
            </section>
        </>
    );
}
