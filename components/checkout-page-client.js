"use client";

import Link from "next/link";
import Script from "next/script";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildCartItemKey, clearCart, countCartItems, getCartItems, removeCartItem, setCartItems, subscribeToCart, updateCartItemQuantity } from "../lib/cart";
import { calculateRemainingForFreeShipping, calculateShippingAmount, FREE_SHIPPING_THRESHOLD } from "../lib/shipping";

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

function isFailurePaymentStatus(status) {
    return ["rejected", "cancelled", "refunded", "charged_back"].includes(String(status || "").trim().toLowerCase());
}

function shouldPollPaymentStatus(payment) {
    const normalizedMethod = String(payment?.method || "").trim().toLowerCase();
    const normalizedStatus = String(payment?.status || "").trim().toLowerCase();
    return normalizedMethod === "pix" && ["pending", "in_process"].includes(normalizedStatus) && Boolean(payment?.id);
}

function getStatusMessage(payment) {
    const normalizedStatus = String(payment?.status || "").trim().toLowerCase();

    if (normalizedStatus === "approved") {
        return "Pagamento aprovado com sucesso.";
    }

    if (normalizedStatus === "pending") {
        return payment?.method === "pix"
            ? "Pix gerado com sucesso. Finalize o pagamento com o QR Code abaixo."
            : "Pagamento criado e aguardando confirmação.";
    }

    if (normalizedStatus === "in_process" || normalizedStatus === "authorized") {
        return "Pagamento em análise pelo Mercado Pago.";
    }

    if (["rejected", "cancelled", "refunded", "charged_back"].includes(normalizedStatus)) {
        return "O pagamento foi recusado. Revise os dados e tente novamente.";
    }

    return "Pagamento processado. Acompanhe o status do pedido no painel administrativo.";
}

function getPaymentFeedback(payment) {
    return {
        message: getStatusMessage(payment),
        tone: isFailurePaymentStatus(payment?.status) ? "error" : "success",
    };
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
    const [isPollingPaymentStatus, setIsPollingPaymentStatus] = useState(false);
    const [sdkReady, setSdkReady] = useState(false);
    const [cardFormReady, setCardFormReady] = useState(false);
    const buyNowAppliedRef = useRef("");
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

        const buyNowKey = [buyNowProductId, buyNowSize, buyNowColor].join("::");

        if (buyNowAppliedRef.current === buyNowKey) {
            return;
        }

        const product = initialProducts.find((currentProduct) => Number(currentProduct.id) === Number(buyNowProductId));

        if (!product) {
            return;
        }

        const selectedSize = String(buyNowSize || product.sizes?.[0] || "").trim();
        const selectedColor = String(buyNowColor || product.colors?.[0] || "").trim();
        const storedItems = getCartItems();
        const existingItemIndex = storedItems.findIndex(
            (item) =>
                Number(item.productId) === Number(product.id) &&
                String(item.selectedSize || "").trim() === selectedSize &&
                String(item.selectedColor || "").trim() === selectedColor
        );

        const nextItems =
            existingItemIndex >= 0
                ? storedItems.map((item, index) =>
                      index === existingItemIndex
                          ? {
                                ...item,
                                quantity: Math.max(1, Number(item.quantity || 1)) + 1,
                            }
                          : item
                  )
                : [
                      ...storedItems,
                      {
                          productId: Number(product.id),
                          quantity: 1,
                          selectedSize,
                          selectedColor,
                      },
                  ];

        console.log("[Checkout] Buy now flow added product to cart.", {
            productId: product.id,
            selectedSize,
            selectedColor,
            previousItemCount: storedItems.length,
            nextItemCount: nextItems.length,
        });

        buyNowAppliedRef.current = buyNowKey;
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
                    throw new Error(data.message || "Não foi possível carregar a configuração do Mercado Pago.");
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
                    setErrorMessage("O Mercado Pago ainda não está configurado. Adicione as chaves para habilitar o checkout.");
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
    const subtotalAmount = useMemo(
        () => Number(resolvedItems.reduce((total, item) => total + item.subtotal, 0).toFixed(2)),
        [resolvedItems]
    );
    const shippingAmount = useMemo(() => calculateShippingAmount(subtotalAmount), [subtotalAmount]);
    const remainingForFreeShipping = useMemo(() => calculateRemainingForFreeShipping(subtotalAmount), [subtotalAmount]);
    const totalAmount = useMemo(() => Number((subtotalAmount + shippingAmount).toFixed(2)), [shippingAmount, subtotalAmount]);
    const totalItems = useMemo(() => countCartItems(cartItems), [cartItems]);
    const cartFingerprint = useMemo(
        () => resolvedItems.map((item) => `${item.key}:${item.quantity}`).join("|"),
        [resolvedItems]
    );
    const hasLockedPayment = useMemo(() => {
        const normalizedStatus = String(paymentResult?.payment?.status || "").trim().toLowerCase();
        return ["approved", "authorized", "pending", "in_process"].includes(normalizedStatus);
    }, [paymentResult]);

    useEffect(() => {
        setPaymentResult(null);
        setStatusMessage("");
        setErrorMessage("");
        setCopiedPixCode(false);
        setIsPollingPaymentStatus(false);
    }, [cartFingerprint]);

    const applyPaymentResponse = useCallback((data) => {
        if (!data?.payment) {
            return;
        }

        setPaymentResult((currentValue) => ({
            ...(currentValue || {}),
            ...(data || {}),
            order: data.order || currentValue?.order || null,
            payment: {
                ...(currentValue?.payment || {}),
                ...(data.payment || {}),
            },
        }));

        const feedback = getPaymentFeedback(data.payment);

        if (feedback.tone === "error") {
            setStatusMessage("");
            setErrorMessage(feedback.message);
        } else {
            setStatusMessage(feedback.message);
            setErrorMessage("");
        }

        if (shouldClearCartAfterPayment(data.payment.status)) {
            clearCart();
            setCartState([]);
        }
    }, []);

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
                        setErrorMessage("Não foi possível carregar o formulário do cartão agora.");
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
                    setErrorMessage("Revise os dados do cartão e tente novamente.");
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

    const polledPaymentId = paymentResult?.payment?.id || "";
    const polledPaymentMethod = paymentResult?.payment?.method || "";
    const polledPaymentStatus = paymentResult?.payment?.status || "";

    useEffect(() => {
        if (
            !shouldPollPaymentStatus({
                id: polledPaymentId,
                method: polledPaymentMethod,
                status: polledPaymentStatus,
            })
        ) {
            setIsPollingPaymentStatus(false);
            return undefined;
        }

        let isCancelled = false;
        let intervalId = null;

        async function loadPaymentStatus() {
            try {
                const response = await fetch(`/api/payments/mercado-pago/payment/${polledPaymentId}`, {
                    cache: "no-store",
                });
                const data = await response.json();

                if (isCancelled || !response.ok || !data.ok || !data.payment) {
                    return;
                }

                console.log("[Checkout] Payment status refreshed.", data);
                applyPaymentResponse(data);

                if (!shouldPollPaymentStatus(data.payment)) {
                    setIsPollingPaymentStatus(false);

                    if (intervalId) {
                        window.clearInterval(intervalId);
                    }
                }
            } catch (error) {
                console.log("[Checkout] Failed to refresh payment status.", error);
            }
        }

        setIsPollingPaymentStatus(true);
        loadPaymentStatus();
        intervalId = window.setInterval(loadPaymentStatus, 5000);

        return () => {
            isCancelled = true;

            if (intervalId) {
                window.clearInterval(intervalId);
            }
        };
    }, [applyPaymentResponse, polledPaymentId, polledPaymentMethod, polledPaymentStatus]);

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
            setErrorMessage("Preencha nome, e-mail, telefone e um CPF válido antes de continuar.");
            return false;
        }

        return true;
    }

    async function submitPayment(method, cardPayload = null) {
        if (!resolvedItems.length) {
            setErrorMessage("Seu carrinho está vazio.");
            return;
        }

        if (hasLockedPayment) {
            setErrorMessage("Já existe um pagamento em aberto para este carrinho. Finalize ou aguarde a confirmação antes de gerar outro.");
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
                throw new Error(data.message || "Não foi possível criar o pagamento.");
            }

            console.log("[Checkout] Payment created.", data);
            applyPaymentResponse(data);
        } catch (error) {
            console.log("[Checkout] Payment request failed.", error);
            setErrorMessage(error.message || "Não foi possível concluir o pagamento.");
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
            setErrorMessage("Não foi possível copiar o código Pix automaticamente.");
        }
    }

    function changeCartItemQuantity(itemKey, nextQuantity) {
        updateCartItemQuantity(itemKey, Math.max(1, Number(nextQuantity || 1)));
    }

    function handleClearCart() {
        if (!resolvedItems.length || hasLockedPayment) {
            return;
        }

        const shouldClear = window.confirm("Deseja limpar todos os itens do carrinho?");

        if (!shouldClear) {
            return;
        }

        console.log("[Checkout] Clearing cart from summary actions.");
        clearCart();
        setCartState([]);
        setStatusMessage("");
        setErrorMessage("");
        setPaymentResult(null);
    }

    return (
        <>
            <Script src="https://sdk.mercadopago.com/js/v2" strategy="afterInteractive" onLoad={() => setSdkReady(true)} />

            <section className="section narrow-section">
                <div className="section-heading align-center">
                    <p className="section-kicker">Checkout seguro</p>
                    <h1>Finalize seu pedido com Pix ou cartão</h1>
                    <p>Escolha os produtos, confirme seus dados e pague direto no site com Mercado Pago.</p>
                </div>

                {!resolvedItems.length ? (
                    <div className="empty-state">
                        <h1>Seu carrinho está vazio no momento</h1>
                        <p>Adicione produtos do catálogo para gerar o pagamento nesta página.</p>
                        <div className="section-actions">
                            <Link href="/produtos" className="primary-button">
                                Ver produtos
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="checkout-layout">
                        <div className="checkout-main">
                            <article className="content-card checkout-card">
                                <div className="checkout-card-header">
                                    <div>
                                        <p className="section-kicker">Dados do cliente</p>
                                        <h2>Informações de cobrança</h2>
                                    </div>
                                    <span className="checkout-chip">{totalItems} item(ns)</span>
                                </div>

                                <div className="form-grid">
                                    <label className="field">
                                        <span>Nome completo</span>
                                        <input value={customer.name} onChange={(event) => updateCustomerField("name", event.target.value)} placeholder="Nome completo do cliente" />
                                    </label>

                                    <label className="field">
                                        <span>E-mail</span>
                                        <input type="email" value={customer.email} onChange={(event) => updateCustomerField("email", event.target.value)} placeholder="seuemail@exemplo.com" />
                                    </label>

                                    <label className="field">
                                        <span>Telefone</span>
                                        <input
                                            value={customer.phone}
                                            onChange={(event) => updateCustomerField("phone", event.target.value)}
                                            placeholder="(11) 99999-9999"
                                            inputMode="tel"
                                            autoComplete="tel"
                                        />
                                    </label>

                                    <label className="field">
                                        <span>CPF</span>
                                        <input
                                            value={customer.cpf}
                                            onChange={(event) => updateCustomerField("cpf", event.target.value)}
                                            placeholder="000.000.000-00"
                                            inputMode="numeric"
                                            autoComplete="off"
                                        />
                                    </label>
                                </div>
                            </article>

                            <article className="content-card checkout-card">
                                <div className="checkout-card-header">
                                    <div>
                                        <p className="section-kicker">Pagamento</p>
                                        <h2>Escolha como pagar</h2>
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
                                        Cartão de crédito
                                    </button>
                                </div>

                                {isLoadingConfig ? <p className="checkout-helper">Carregando configuração de pagamento...</p> : null}
                                {!paymentConfig.enabled && !isLoadingConfig ? (
                                    <p className="checkout-helper checkout-helper-error">
                                        As chaves do Mercado Pago não foram configuradas. Adicione `MERCADO_PAGO_ACCESS_TOKEN` e `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY` para habilitar o checkout.
                                    </p>
                                ) : null}

                                {statusMessage ? <div className="checkout-alert checkout-alert-success">{statusMessage}</div> : null}
                                {errorMessage ? <div className="checkout-alert checkout-alert-error">{errorMessage}</div> : null}

                                {paymentMethod === "pix" ? (
                                    <div className="payment-panel">
                                        <p className="checkout-helper">Gere a cobrança Pix e exiba o QR Code logo após a criação do pedido.</p>
                                        <button type="button" className="primary-button" onClick={() => submitPayment("pix")} disabled={isSubmitting || !paymentConfig.pixEnabled || hasLockedPayment}>
                                            {isSubmitting ? "Gerando Pix..." : "Gerar Pix"}
                                        </button>

                                        {paymentResult?.payment?.method === "pix" && paymentResult.payment.qrCode ? (
                                            <div className="pix-result-card">
                                                {paymentResult.payment.qrCodeBase64 ? (
                                                    <img
                                                        src={`data:image/png;base64,${paymentResult.payment.qrCodeBase64}`}
                                                        alt="QR Code do Pix"
                                                        className="pix-qr-image"
                                                    />
                                                ) : null}
                                                <textarea
                                                    className="pix-code-textarea"
                                                    value={paymentResult.payment.qrCode}
                                                    readOnly
                                                    aria-label="Código Pix"
                                                />
                                                <div className="section-actions">
                                                    <button type="button" className="secondary-button" onClick={copyPixCode}>
                                                        {copiedPixCode ? "Copiado" : "Copiar código Pix"}
                                                    </button>
                                                </div>
                                                {isPollingPaymentStatus ? (
                                                    <p className="checkout-helper">Aguardando confirmação automática do Pix. Esta página atualiza o status a cada poucos segundos.</p>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </div>
                                ) : (
                                    <div className="payment-panel">
                                        <p className="checkout-helper">Os dados do cartão são tokenizados pelo Mercado Pago diretamente no navegador.</p>

                                        <form id="checkout-card-form" className="checkout-card-form">
                                            <input id="form-checkout__cardholderName" type="hidden" value={customer.name} readOnly />
                                            <input id="form-checkout__cardholderEmail" type="hidden" value={customer.email} readOnly />
                                            <select id="form-checkout__identificationType" className="checkout-hidden-field" defaultValue="CPF" aria-hidden="true">
                                                <option value="CPF">CPF</option>
                                            </select>
                                            <input id="form-checkout__identificationNumber" type="hidden" value={sanitizeDocument(customer.cpf)} readOnly />

                                            <div className="form-grid">
                                                <label className="field field-full">
                                                    <span>Número do cartão</span>
                                                    <div id="form-checkout__cardNumber" className="checkout-sdk-field" />
                                                </label>

                                                <label className="field">
                                                    <span>Data de validade</span>
                                                    <div id="form-checkout__expirationDate" className="checkout-sdk-field" />
                                                </label>

                                                <label className="field">
                                                    <span>Código de segurança</span>
                                                    <div id="form-checkout__securityCode" className="checkout-sdk-field" />
                                                </label>

                                                <label className="field">
                                                    <span>Banco emissor</span>
                                                    <select id="form-checkout__issuer" defaultValue="" />
                                                </label>

                                                <label className="field">
                                                    <span>Parcelas</span>
                                                    <select id="form-checkout__installments" defaultValue="" />
                                                </label>
                                            </div>

                                            <button type="submit" className="primary-button" disabled={isSubmitting || !cardFormReady || !paymentConfig.cardEnabled || hasLockedPayment}>
                                                {isSubmitting ? "Processando cartão..." : "Pagar com cartão"}
                                            </button>
                                        </form>

                                        {!sdkReady ? <p className="checkout-helper">Carregando SDK do Mercado Pago...</p> : null}
                                        {sdkReady && !cardFormReady && paymentConfig.cardEnabled ? (
                                            <p className="checkout-helper">Preparando campos seguros do cartão...</p>
                                        ) : null}
                                    </div>
                                )}
                            </article>
                        </div>

                        <aside className="checkout-sidebar">
                            <article className="content-card checkout-card checkout-summary-card">
                                <div className="checkout-card-header">
                                    <div>
                                        <p className="section-kicker">Resumo</p>
                                        <h2>Seu carrinho</h2>
                                    </div>
                                </div>

                                <div className="checkout-summary-list">
                                    {resolvedItems.map((item) => (
                                        <div key={item.key} className="checkout-summary-item">
                                            <img src={item.product.image} alt={item.product.name} className="checkout-summary-image" />
                                            <div className="checkout-summary-copy">
                                                <strong>{item.product.name}</strong>
                                                <span>
                                                    {item.selectedColor || "Cor padrão"} • {item.selectedSize || "Tamanho padrão"}
                                                </span>
                                                <span>{formatCurrency(item.product.price)} cada</span>
                                                <span>Edite a quantidade ou exclua o item abaixo.</span>
                                                <div className="checkout-quantity-row">
                                                    <div className="checkout-quantity-editor">
                                                        <button
                                                            type="button"
                                                            className="secondary-button checkout-quantity-button"
                                                            onClick={() => changeCartItemQuantity(item.key, item.quantity - 1)}
                                                            disabled={hasLockedPayment || item.quantity <= 1}
                                                        >
                                                            -
                                                        </button>
                                                        <label className="field">
                                                            <span>Qtd.</span>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={item.quantity}
                                                                onChange={(event) => changeCartItemQuantity(item.key, event.target.value)}
                                                                disabled={hasLockedPayment}
                                                                inputMode="numeric"
                                                            />
                                                        </label>
                                                        <button
                                                            type="button"
                                                            className="secondary-button checkout-quantity-button"
                                                            onClick={() => changeCartItemQuantity(item.key, item.quantity + 1)}
                                                            disabled={hasLockedPayment}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    <button type="button" className="text-button" onClick={() => removeCartItem(item.key)} disabled={hasLockedPayment}>
                                                        Excluir
                                                    </button>
                                                </div>
                                            </div>
                                            <strong>{formatCurrency(item.subtotal)}</strong>
                                        </div>
                                    ))}
                                </div>

                                <div className="checkout-total-row">
                                    <span>Subtotal</span>
                                    <strong>{formatCurrency(subtotalAmount)}</strong>
                                </div>

                                <div className="checkout-total-row">
                                    <span>Frete Sedex</span>
                                    <strong>{shippingAmount === 0 ? "Grátis" : formatCurrency(shippingAmount)}</strong>
                                </div>

                                {shippingAmount > 0 ? (
                                    <p className="checkout-helper">
                                        Faltam {formatCurrency(remainingForFreeShipping)} para liberar frete grátis acima de {formatCurrency(FREE_SHIPPING_THRESHOLD)}. Até lá, o frete único via Sedex é de {formatCurrency(shippingAmount)}.
                                    </p>
                                ) : (
                                    <p className="checkout-helper">Você liberou o frete grátis para esta compra.</p>
                                )}

                                <div className="checkout-total-row">
                                    <span>Total com frete</span>
                                    <strong>{formatCurrency(totalAmount)}</strong>
                                </div>

                                <div className="section-actions">
                                    <Link href="/produtos" className="secondary-button">
                                        Adicionar mais produtos
                                    </Link>
                                    <button type="button" className="text-button" onClick={handleClearCart} disabled={!resolvedItems.length || hasLockedPayment}>
                                        Limpar carrinho
                                    </button>
                                </div>
                            </article>
                        </aside>
                    </div>
                )}
            </section>
        </>
    );
}
