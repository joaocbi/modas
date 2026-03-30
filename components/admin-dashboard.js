"use client";

import { ChevronLeft, ChevronRight, CreditCard, FolderKanban, ImagePlus, Package2, Search, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const PAYMENT_METHOD_OPTIONS = ["Pix", "Cartão de crédito", "Cartão de débito", "Boleto", "Mercado Pago"];
const DEFAULT_PRODUCT_IMAGE = "/assets/product_1.jpg";
const MAX_PRODUCT_IMAGES = 10;

function normalizeClientImages(images) {
    return [...new Set((images || []).map((item) => String(item || "").trim()).filter(Boolean))].slice(0, MAX_PRODUCT_IMAGES);
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Failed to read image file."));
        reader.readAsDataURL(file);
    });
}

function parseDecimalValue(value) {
    const normalizedValue = String(value || "").trim();

    if (!normalizedValue) {
        return 0;
    }

    if (normalizedValue.includes(",")) {
        return Number(normalizedValue.replace(/\./g, "").replace(",", "."));
    }

    return Number(normalizedValue);
}

function sanitizeDecimalInput(value) {
    const normalizedValue = String(value || "").replace(/[^\d.,]/g, "");

    if (!normalizedValue) {
        return "";
    }

    if (normalizedValue.includes(",")) {
        const withoutDots = normalizedValue.replace(/\./g, "");
        const [integerPart, ...decimalParts] = withoutDots.split(",");
        return decimalParts.length ? `${integerPart},${decimalParts.join("").slice(0, 2)}` : integerPart;
    }

    const [integerPart, ...decimalParts] = normalizedValue.split(".");
    return decimalParts.length ? `${integerPart}.${decimalParts.join("").slice(0, 2)}` : integerPart;
}

function formatDecimalInput(value) {
    if (value === "" || value === null || value === undefined) {
        return "";
    }

    return parseDecimalValue(value).toFixed(2).replace(".", ",");
}

function calculateSalePrice(costPrice, salesFeePercentage) {
    const normalizedCostPrice = parseDecimalValue(costPrice);
    const normalizedSalesFeePercentage = parseDecimalValue(salesFeePercentage);

    return Number((normalizedCostPrice * (1 + normalizedSalesFeePercentage / 100)).toFixed(2));
}

function calculateTotalCost(costPrice) {
    return Number(parseDecimalValue(costPrice).toFixed(2));
}

function calculateEstimatedProfit(price, totalCost) {
    return Number((parseDecimalValue(price) - parseDecimalValue(totalCost)).toFixed(2));
}

function calculateMarginPercentage(price, totalCost) {
    const normalizedPrice = parseDecimalValue(price);
    const normalizedProfit = calculateEstimatedProfit(price, totalCost);

    if (normalizedPrice <= 0) {
        return 0;
    }

    return Number(((normalizedProfit / normalizedPrice) * 100).toFixed(2));
}

function getMarginTone(marginPercentage) {
    if (marginPercentage <= 10) {
        return "danger";
    }

    if (marginPercentage <= 20) {
        return "warning";
    }

    return "success";
}

function recalculateProductPricing(productForm) {
    const nextPrice = calculateSalePrice(productForm.costPrice, productForm.salesFeePercentage);
    const nextTotalCost = calculateTotalCost(productForm.costPrice);

    return {
        ...productForm,
        price: formatDecimalInput(nextPrice),
        totalCost: formatDecimalInput(nextTotalCost),
    };
}

function getEmptyProductForm() {
    return {
        id: "",
        name: "",
        description: "",
        category: "",
        subcategory: "",
        sizes: "",
        colors: "",
        paymentMethods: ["Pix", "Cartão de crédito", "Mercado Pago"],
        price: "",
        oldPrice: "",
        costPrice: "",
        salesFeePercentage: "5",
        totalCost: "0.00",
        mercadoPagoEnabled: false,
        mercadoPagoLink: "",
        badge: "",
        image: DEFAULT_PRODUCT_IMAGE,
        images: [DEFAULT_PRODUCT_IMAGE],
        featured: true,
    };
}

function getEmptyOrderForm() {
    return {
        id: "",
        customer: "",
        total: "",
        status: "pending",
        channel: "WhatsApp",
        itemCount: "1",
    };
}

function getEmptyCouponForm() {
    return {
        id: "",
        code: "",
        type: "percent",
        value: "",
        minOrder: "",
        active: true,
        usageCount: "0",
    };
}

function formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(parseDecimalValue(value));
}

function formatPercent(value) {
    return `${parseDecimalValue(value).toFixed(2).replace(".", ",")}%`;
}

async function sendAdminRequest(url, method, payload) {
    const response = await fetch(url, {
        method,
        headers: {
            "Content-Type": "application/json",
        },
        body: payload ? JSON.stringify(payload) : undefined,
    });

    const data = await response.json();
    return { response, data };
}

function MetricCard({ label, value, help }) {
    return (
        <article className="content-card admin-metric-card">
            <strong>{label}</strong>
            <h2>{value}</h2>
            {help ? <p>{help}</p> : null}
        </article>
    );
}

function ChartCard({ title, items }) {
    const maxValue = Math.max(...items.map((item) => item.value), 1);

    return (
        <article className="content-card admin-chart-card">
            <strong>{title}</strong>
            <div className="admin-chart-list">
                {items.map((item) => (
                    <div key={item.label} className="admin-chart-row">
                        <div className="admin-chart-header">
                            <span>{item.label}</span>
                            <strong>{item.value}</strong>
                        </div>
                        <div className="admin-chart-track">
                            <div className="admin-chart-bar" style={{ width: `${(item.value / maxValue) * 100}%` }} />
                        </div>
                    </div>
                ))}
            </div>
        </article>
    );
}

function AdminFormSection({ icon: Icon, title, description }) {
    return (
        <div className="field-full admin-form-section-title">
            <div className="admin-form-section-heading">
                <span className="admin-form-section-icon">
                    <Icon size={18} />
                </span>
                <div>
                    <strong>{title}</strong>
                    <p>{description}</p>
                </div>
            </div>
        </div>
    );
}

export function AdminDashboard({
    initialProducts,
    initialOrders,
    initialCoupons,
    initialLeads,
    adminEmail,
    storageMode,
    canManage,
}) {
    const [products, setProducts] = useState(initialProducts);
    const [orders, setOrders] = useState(initialOrders);
    const [coupons, setCoupons] = useState(initialCoupons);
    const [leads, setLeads] = useState(initialLeads);
    const [productForm, setProductForm] = useState(getEmptyProductForm());
    const [orderForm, setOrderForm] = useState(getEmptyOrderForm());
    const [couponForm, setCouponForm] = useState(getEmptyCouponForm());
    const [activeTab, setActiveTab] = useState("overview");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusMessage, setStatusMessage] = useState("");
    const [statusType, setStatusType] = useState("success");
    const [isSaving, setIsSaving] = useState(false);
    const [imagePreview, setImagePreview] = useState("/assets/product_1.jpg");
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [zoomedImage, setZoomedImage] = useState("");
    const estimatedProfit = useMemo(() => calculateEstimatedProfit(productForm.price, productForm.totalCost), [productForm.price, productForm.totalCost]);
    const estimatedMarginPercentage = useMemo(
        () => calculateMarginPercentage(productForm.price, productForm.totalCost),
        [productForm.price, productForm.totalCost]
    );
    const marginTone = useMemo(() => getMarginTone(estimatedMarginPercentage), [estimatedMarginPercentage]);

    const totalFeatured = useMemo(() => products.filter((product) => product.featured).length, [products]);
    const totalRevenue = useMemo(() => orders.reduce((sum, order) => sum + Number(order.total || 0), 0), [orders]);
    const activeCoupons = useMemo(() => coupons.filter((coupon) => coupon.active).length, [coupons]);
    const openLeads = useMemo(() => leads.filter((lead) => lead.status === "new").length, [leads]);

    const orderStatusChart = useMemo(() => {
        const summary = orders.reduce((accumulator, order) => {
            const key = String(order.status || "unknown").toLowerCase();
            accumulator[key] = (accumulator[key] || 0) + 1;
            return accumulator;
        }, {});

        return Object.entries(summary).map(([label, value]) => ({ label, value }));
    }, [orders]);

    const leadChannelChart = useMemo(() => {
        const summary = leads.reduce((accumulator, lead) => {
            const key = String(lead.channel || "unknown").toLowerCase();
            accumulator[key] = (accumulator[key] || 0) + 1;
            return accumulator;
        }, {});

        return Object.entries(summary).map(([label, value]) => ({ label, value }));
    }, [leads]);

    const filteredProducts = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        if (!normalizedSearch) {
            return products;
        }

        return products.filter((product) =>
            [
                product.name,
                product.category,
                product.subcategory,
                product.badge,
                ...(product.paymentMethods || []),
            ].some((value) => String(value || "").toLowerCase().includes(normalizedSearch))
        );
    }, [products, searchTerm]);

    const filteredOrders = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        if (!normalizedSearch) {
            return orders;
        }

        return orders.filter((order) =>
            [order.customer, order.status, order.channel, String(order.id)].some((value) => String(value || "").toLowerCase().includes(normalizedSearch))
        );
    }, [orders, searchTerm]);

    const filteredCoupons = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        if (!normalizedSearch) {
            return coupons;
        }

        return coupons.filter((coupon) =>
            [coupon.code, coupon.type, coupon.active ? "ativo" : "inativo"].some((value) => String(value || "").toLowerCase().includes(normalizedSearch))
        );
    }, [coupons, searchTerm]);

    const filteredLeads = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        if (!normalizedSearch) {
            return leads;
        }

        return leads.filter((lead) =>
            [lead.name, lead.email, lead.phone, lead.subject, lead.channel, lead.status].some((value) =>
                String(value || "").toLowerCase().includes(normalizedSearch)
            )
        );
    }, [leads, searchTerm]);

    function showStatus(type, message) {
        setStatusType(type);
        setStatusMessage(message);
    }

    function resetProductForm() {
        setProductForm(getEmptyProductForm());
        setImagePreview(DEFAULT_PRODUCT_IMAGE);
    }

    function openNewProductModal() {
        resetProductForm();
        setIsProductModalOpen(true);
        showStatus("success", "Preencha os dados para cadastrar um novo produto.");
    }

    function closeProductModal() {
        setIsProductModalOpen(false);
        setZoomedImage("");
        resetProductForm();
    }

    function openImageLightbox(image) {
        setZoomedImage(String(image || imagePreview || DEFAULT_PRODUCT_IMAGE));
    }

    function closeImageLightbox() {
        setZoomedImage("");
    }

    function resetOrderForm() {
        setOrderForm(getEmptyOrderForm());
    }

    function resetCouponForm() {
        setCouponForm(getEmptyCouponForm());
    }

    function updateProductField(name, value) {
        const normalizedValue = ["oldPrice", "costPrice", "salesFeePercentage"].includes(name) ? sanitizeDecimalInput(value) : value;

        setProductForm((current) => {
            let nextProductForm = { ...current, [name]: normalizedValue };

            if (["costPrice", "salesFeePercentage"].includes(name)) {
                nextProductForm = recalculateProductPricing(nextProductForm);
            }

            return nextProductForm;
        });

        if (name === "image") {
            setImagePreview(String(value || "") || DEFAULT_PRODUCT_IMAGE);
        }
    }

    function applyProductImages(nextImages, preferredPreviewImage, options = {}) {
        const normalizedImages = normalizeClientImages(nextImages);
        const allowEmpty = Boolean(options.allowEmpty);

        if (!normalizedImages.length && allowEmpty) {
            setProductForm((current) => ({
                ...current,
                image: "",
                images: [],
            }));
            setImagePreview(DEFAULT_PRODUCT_IMAGE);
            return;
        }

        const fallbackImage = normalizedImages[0] || DEFAULT_PRODUCT_IMAGE;
        const nextPreviewImage = preferredPreviewImage && normalizedImages.includes(preferredPreviewImage) ? preferredPreviewImage : fallbackImage;

        setProductForm((current) => ({
            ...current,
            image: fallbackImage,
            images: normalizedImages,
        }));
        setImagePreview(nextPreviewImage);
    }

    function updateProductImagesFromText(value) {
        const nextImages = value
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean);

        applyProductImages(nextImages, imagePreview);
    }

    function removeProductImage(imageToRemove) {
        const nextImages = (productForm.images || []).filter((image) => image !== imageToRemove);
        applyProductImages(nextImages, imagePreview === imageToRemove ? nextImages[0] : imagePreview, { allowEmpty: true });
        showStatus("success", "Imagem removida do produto.");
    }

    function focusAdjacentPreviewImage(direction) {
        const currentImages = productForm.images || [];

        if (currentImages.length <= 1) {
            return;
        }

        const currentIndex = currentImages.findIndex((image) => image === imagePreview);
        const safeIndex = currentIndex >= 0 ? currentIndex : 0;
        const nextIndex =
            direction === "left"
                ? (safeIndex - 1 + currentImages.length) % currentImages.length
                : (safeIndex + 1) % currentImages.length;

        setImagePreview(currentImages[nextIndex]);
    }

    function moveProductImage(imageToMove, direction) {
        const currentImages = [...(productForm.images || [])];
        const currentIndex = currentImages.findIndex((image) => image === imageToMove);

        if (currentIndex < 0) {
            return;
        }

        const targetIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;

        if (targetIndex < 0 || targetIndex >= currentImages.length) {
            return;
        }

        [currentImages[currentIndex], currentImages[targetIndex]] = [currentImages[targetIndex], currentImages[currentIndex]];
        applyProductImages(currentImages, imagePreview === imageToMove ? currentImages[targetIndex] : imagePreview);
        showStatus("success", "Ordem das imagens atualizada.");
    }

    function setProductCoverImage(imageToPromote) {
        const currentImages = [...(productForm.images || [])];
        const currentIndex = currentImages.findIndex((image) => image === imageToPromote);

        if (currentIndex <= 0) {
            setImagePreview(imageToPromote || DEFAULT_PRODUCT_IMAGE);
            return;
        }

        const nextImages = [currentImages[currentIndex], ...currentImages.filter((image) => image !== imageToPromote)];
        applyProductImages(nextImages, imageToPromote);
        showStatus("success", "Imagem definida como capa do produto.");
    }

    function togglePaymentMethod(method) {
        setProductForm((current) => {
            const hasMethod = current.paymentMethods.includes(method);
            const nextPaymentMethods = hasMethod
                ? current.paymentMethods.filter((item) => item !== method)
                : [...current.paymentMethods, method];

            return {
                ...current,
                paymentMethods: nextPaymentMethods,
                mercadoPagoEnabled: method === "Mercado Pago" ? !hasMethod || current.mercadoPagoEnabled : current.mercadoPagoEnabled,
            };
        });
    }

    function updateOrderField(name, value) {
        setOrderForm((current) => ({ ...current, [name]: value }));
    }

    function updateCouponField(name, value) {
        setCouponForm((current) => ({ ...current, [name]: value }));
    }

    async function handleLogout() {
        await fetch("/api/admin/logout", { method: "POST" });
        window.location.href = "/admin/login";
    }

    function startEditingProduct(product) {
        const normalizedImages = normalizeClientImages(product.images?.length ? product.images : [product.image]);
        const pricingForm = recalculateProductPricing({
            costPrice: String(product.costPrice || 0),
            salesFeePercentage: String(product.salesFeePercentage || 0),
        });

        setActiveTab("products");
        setProductForm({
            id: String(product.id),
            name: product.name,
            description: product.description,
            category: product.category,
            subcategory: product.subcategory || "",
            sizes: product.sizes.join(", "),
            colors: product.colors.join(", "),
            paymentMethods: product.paymentMethods || [],
            price: pricingForm.price,
            oldPrice: formatDecimalInput(product.oldPrice),
            costPrice: formatDecimalInput(product.costPrice || 0),
            salesFeePercentage: formatDecimalInput(product.salesFeePercentage || 0),
            totalCost: pricingForm.totalCost,
            mercadoPagoEnabled: Boolean(product.mercadoPagoEnabled),
            mercadoPagoLink: product.mercadoPagoLink || "",
            badge: product.badge,
            image: normalizedImages[0] || DEFAULT_PRODUCT_IMAGE,
            images: normalizedImages,
            featured: Boolean(product.featured),
        });
        setImagePreview(normalizedImages[0] || DEFAULT_PRODUCT_IMAGE);
        setIsProductModalOpen(true);
        showStatus("success", `Editando produto ${product.name}.`);
    }

    function startEditingOrder(order) {
        setActiveTab("orders");
        setOrderForm({
            id: String(order.id),
            customer: order.customer,
            total: String(order.total),
            status: order.status,
            channel: order.channel,
            itemCount: String(order.itemCount),
        });
        showStatus("success", `Editando pedido #${order.id}.`);
    }

    function startEditingCoupon(coupon) {
        setActiveTab("coupons");
        setCouponForm({
            id: String(coupon.id),
            code: coupon.code,
            type: coupon.type,
            value: String(coupon.value),
            minOrder: String(coupon.minOrder),
            active: Boolean(coupon.active),
            usageCount: String(coupon.usageCount),
        });
        showStatus("success", `Editando cupom ${coupon.code}.`);
    }

    async function handleImageUpload(event) {
        const files = Array.from(event.target.files || []);
        if (!files.length) {
            return;
        }

        const currentImages = productForm.images || [];
        const remainingSlots = MAX_PRODUCT_IMAGES - currentImages.length;

        if (remainingSlots <= 0) {
            showStatus("warning", `Limite de ${MAX_PRODUCT_IMAGES} imagens por produto atingido.`);
            event.target.value = "";
            return;
        }

        const filesToLoad = files.slice(0, remainingSlots);

        try {
            const uploadedImages = await Promise.all(filesToLoad.map(readFileAsDataUrl));
            const nextImages = [...currentImages, ...uploadedImages];

            console.log("[AdminDashboard] Product images uploaded.", {
                selectedFiles: files.length,
                uploadedFiles: uploadedImages.length,
            });

            applyProductImages(nextImages, uploadedImages[0] || imagePreview);
            showStatus(
                "success",
                files.length > filesToLoad.length
                    ? `Foram carregadas ${uploadedImages.length} imagens. O limite por produto é ${MAX_PRODUCT_IMAGES}.`
                    : `${uploadedImages.length} imagem(ns) carregada(s) com sucesso para este produto.`
            );
        } catch (error) {
            console.log("[AdminDashboard] Failed to upload product images.", error);
            showStatus("warning", "Nao foi possivel carregar a imagem selecionada.");
        } finally {
            event.target.value = "";
        }
    }

    async function handleProductSubmit(event) {
        event.preventDefault();
        setIsSaving(true);
        setStatusMessage("");

        try {
            const isEditing = Boolean(productForm.id);
            const normalizedPricingForm = recalculateProductPricing(productForm);
            const payload = {
                ...normalizedPricingForm,
                price: parseDecimalValue(normalizedPricingForm.price || 0),
                oldPrice: parseDecimalValue(productForm.oldPrice || 0),
                costPrice: parseDecimalValue(productForm.costPrice || 0),
                salesFeePercentage: parseDecimalValue(productForm.salesFeePercentage || 0),
                totalCost: parseDecimalValue(normalizedPricingForm.totalCost || 0),
                featured: Boolean(productForm.featured),
                mercadoPagoEnabled: Boolean(productForm.mercadoPagoEnabled),
                images: normalizeClientImages(productForm.images),
            };
            const { response, data } = await sendAdminRequest("/api/admin/products", isEditing ? "PATCH" : "POST", payload);
            console.log("[AdminDashboard] Product response.", data);

            if (!response.ok) {
                showStatus("warning", data.message || "Nao foi possivel salvar o produto.");
                return;
            }

            setProducts((currentProducts) =>
                isEditing
                    ? currentProducts.map((product) => (Number(product.id) === Number(data.product.id) ? data.product : product))
                    : [...currentProducts, data.product]
            );

            closeProductModal();
            showStatus(
                "success",
                isEditing
                    ? `Produto atualizado com sucesso. Preco de venda salvo: ${formatCurrency(data.product.price)}.`
                    : `Produto criado com sucesso. Preco de venda salvo: ${formatCurrency(data.product.price)}.`
            );
        } catch (error) {
            console.log("[AdminDashboard] Failed to save product.", error);
            showStatus("warning", "Ocorreu um erro ao salvar o produto.");
        } finally {
            setIsSaving(false);
        }
    }

    useEffect(() => {
        if (!isProductModalOpen && !zoomedImage) {
            return undefined;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isProductModalOpen, zoomedImage]);

    async function handleOrderSubmit(event) {
        event.preventDefault();
        setIsSaving(true);
        setStatusMessage("");

        try {
            const isEditing = Boolean(orderForm.id);
            const payload = {
                ...orderForm,
                total: Number(orderForm.total || 0),
                itemCount: Number(orderForm.itemCount || 0),
            };
            const { response, data } = await sendAdminRequest("/api/admin/orders", isEditing ? "PATCH" : "POST", payload);
            console.log("[AdminDashboard] Order response.", data);

            if (!response.ok) {
                showStatus("warning", data.message || "Nao foi possivel salvar o pedido.");
                return;
            }

            setOrders((currentOrders) =>
                isEditing
                    ? currentOrders.map((order) => (Number(order.id) === Number(data.order.id) ? data.order : order))
                    : [...currentOrders, data.order]
            );
            resetOrderForm();
            showStatus("success", isEditing ? "Pedido atualizado com sucesso." : "Pedido criado com sucesso.");
        } catch (error) {
            console.log("[AdminDashboard] Failed to save order.", error);
            showStatus("warning", "Ocorreu um erro ao salvar o pedido.");
        } finally {
            setIsSaving(false);
        }
    }

    async function handleCouponSubmit(event) {
        event.preventDefault();
        setIsSaving(true);
        setStatusMessage("");

        try {
            const isEditing = Boolean(couponForm.id);
            const payload = {
                ...couponForm,
                value: Number(couponForm.value || 0),
                minOrder: Number(couponForm.minOrder || 0),
                usageCount: Number(couponForm.usageCount || 0),
                active: Boolean(couponForm.active),
            };
            const { response, data } = await sendAdminRequest("/api/admin/coupons", isEditing ? "PATCH" : "POST", payload);
            console.log("[AdminDashboard] Coupon response.", data);

            if (!response.ok) {
                showStatus("warning", data.message || "Nao foi possivel salvar o cupom.");
                return;
            }

            setCoupons((currentCoupons) =>
                isEditing
                    ? currentCoupons.map((coupon) => (Number(coupon.id) === Number(data.coupon.id) ? data.coupon : coupon))
                    : [...currentCoupons, data.coupon]
            );
            resetCouponForm();
            showStatus("success", isEditing ? "Cupom atualizado com sucesso." : "Cupom criado com sucesso.");
        } catch (error) {
            console.log("[AdminDashboard] Failed to save coupon.", error);
            showStatus("warning", "Ocorreu um erro ao salvar o cupom.");
        } finally {
            setIsSaving(false);
        }
    }

    async function updateLeadStatus(lead, nextStatus) {
        if (!canManage) {
            return;
        }

        try {
            const { response, data } = await sendAdminRequest("/api/admin/leads", "PATCH", {
                ...lead,
                status: nextStatus,
            });

            if (!response.ok) {
                showStatus("warning", data.message || "Nao foi possivel atualizar o lead.");
                return;
            }

            setLeads((currentLeads) => currentLeads.map((item) => (Number(item.id) === Number(data.lead.id) ? data.lead : item)));
            showStatus("success", "Lead atualizado com sucesso.");
        } catch (error) {
            console.log("[AdminDashboard] Failed to update lead.", error);
            showStatus("warning", "Ocorreu um erro ao atualizar o lead.");
        }
    }

    async function handleDelete(entity, id) {
        if (!window.confirm("Deseja remover este item?")) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/${entity}?id=${id}`, { method: "DELETE" });
            const data = await response.json();
            console.log("[AdminDashboard] Delete response.", { entity, data });

            if (!response.ok) {
                showStatus("warning", data.message || "Nao foi possivel remover o item.");
                return;
            }

            if (entity === "products") {
                setProducts((current) => current.filter((item) => Number(item.id) !== Number(id)));
            }
            if (entity === "orders") {
                setOrders((current) => current.filter((item) => Number(item.id) !== Number(id)));
            }
            if (entity === "coupons") {
                setCoupons((current) => current.filter((item) => Number(item.id) !== Number(id)));
            }
            if (entity === "leads") {
                setLeads((current) => current.filter((item) => Number(item.id) !== Number(id)));
            }

            showStatus("success", "Item removido com sucesso.");
        } catch (error) {
            console.log("[AdminDashboard] Failed to delete item.", error);
            showStatus("warning", "Ocorreu um erro ao remover o item.");
        }
    }

    return (
        <div className="admin-shell">
            <div className="admin-topbar">
                <div>
                    <p className="section-kicker">Painel seguro</p>
                    <h1>Gerenciar loja</h1>
                    <p>Logado como {adminEmail}</p>
                </div>
                <button type="button" className="secondary-button" onClick={handleLogout}>
                    Sair
                </button>
            </div>

            <div className="admin-storage-banner">
                <strong>Modo de armazenamento:</strong> {storageMode === "database" ? "PostgreSQL com Prisma" : "Fallback local em arquivo"}
                {!canManage ? " â€¢ leitura apenas ate configurar DATABASE_URL" : ""}
            </div>

            <div className="admin-metrics">
                <MetricCard label="Produtos" value={products.length} help="Itens no catalogo" />
                <MetricCard label="Destaques" value={totalFeatured} help="Produtos em destaque" />
                <MetricCard label="Pedidos" value={orders.length} help="Pedidos cadastrados" />
                <MetricCard label="Receita" value={formatCurrency(totalRevenue)} help="Total somado dos pedidos" />
                <MetricCard label="Cupons ativos" value={activeCoupons} help="Campanhas ativas" />
                <MetricCard label="Leads abertos" value={openLeads} help="Contatos aguardando retorno" />
            </div>

            <div className="admin-overview-grid">
                <ChartCard title="Status dos pedidos" items={orderStatusChart.length ? orderStatusChart : [{ label: "sem dados", value: 0 }]} />
                <ChartCard title="Origem dos leads" items={leadChannelChart.length ? leadChannelChart : [{ label: "sem dados", value: 0 }]} />
            </div>

            <div className="admin-toolbar">
                <div className="admin-tabs">
                    <button type="button" className={`admin-tab ${activeTab === "overview" ? "is-active" : ""}`} onClick={() => setActiveTab("overview")}>Visao geral</button>
                    <button type="button" className={`admin-tab ${activeTab === "products" ? "is-active" : ""}`} onClick={() => setActiveTab("products")}>Produtos</button>
                    <button type="button" className={`admin-tab ${activeTab === "orders" ? "is-active" : ""}`} onClick={() => setActiveTab("orders")}>Pedidos</button>
                    <button type="button" className={`admin-tab ${activeTab === "coupons" ? "is-active" : ""}`} onClick={() => setActiveTab("coupons")}>Cupons</button>
                    <button type="button" className={`admin-tab ${activeTab === "leads" ? "is-active" : ""}`} onClick={() => setActiveTab("leads")}>Leads</button>
                </div>
                <label className="field admin-search-field">
                    <span>Buscar</span>
                    <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Filtrar por nome, codigo, status ou canal" />
                </label>
            </div>

            {statusMessage ? <p className={`form-status form-status-${statusType}`}>{statusMessage}</p> : null}

            {activeTab === "overview" ? (
                <div className="admin-grid">
                    <section className="contact-card">
                        <div className="section-heading">
                            <h2>Resumo operacional</h2>
                            <p>Use as abas para editar dados e acompanhe aqui a situacao geral da loja.</p>
                        </div>
                        <div className="admin-summary-grid">
                            <div className="highlight-item">Produtos listados: {products.length}</div>
                            <div className="highlight-item">Pedidos pendentes: {orders.filter((order) => order.status === "pending").length}</div>
                            <div className="highlight-item">Cupons ativos: {activeCoupons}</div>
                            <div className="highlight-item">Leads novos: {openLeads}</div>
                        </div>
                    </section>
                    <section className="contact-card">
                        <div className="section-heading">
                            <h2>Proximas acoes</h2>
                            <p>Atalhos para o time comercial.</p>
                        </div>
                        <div className="admin-product-list">
                            <article className="admin-product-card"><div><strong>Atualizar destaques</strong><p>Revise quais produtos aparecem na home.</p></div></article>
                            <article className="admin-product-card"><div><strong>Responder leads novos</strong><p>Priorize contatos com status new.</p></div></article>
                            <article className="admin-product-card"><div><strong>Conferir cupons ativos</strong><p>Valide minimo, valor e uso total.</p></div></article>
                        </div>
                    </section>
                </div>
            ) : null}

            {activeTab === "products" ? (
                <div className="admin-grid admin-grid-single">
                    <section className="contact-card">
                        <div className="section-heading">
                            <h2>Produtos cadastrados</h2>
                            <p>Cadastre, edite e remova produtos pelo modal de manutenção.</p>
                        </div>
                        <div className="section-actions admin-section-actions">
                            <button type="button" className="primary-button" onClick={openNewProductModal} disabled={!canManage}>
                                Novo produto
                            </button>
                        </div>
                        <div className="admin-product-list">
                            {filteredProducts.map((product) => (
                                <article key={product.id} className="admin-product-card">
                                    <div>
                                        <strong>{product.name}</strong>
                                        <p>
                                            {product.category}
                                            {product.subcategory ? ` • ${product.subcategory}` : ""}
                                        </p>
                                        <span>
                                            {product.badge} • Venda {formatCurrency(product.price)} • Custo {formatCurrency(product.totalCost)}
                                        </span>
                                        <span>
                                            Taxa {formatPercent(product.salesFeePercentage)} • Lucro estimado{" "}
                                            {formatCurrency(Number(product.price || 0) - Number(product.totalCost || 0))}
                                        </span>
                                        <span>Pagamentos: {(product.paymentMethods || []).join(" • ") || "Não informado"}</span>
                                        <span>{(product.images || [product.image]).length} imagem(ns) cadastrada(s)</span>
                                        {product.mercadoPagoEnabled ? (
                                            <span>Mercado Pago ativo{product.mercadoPagoLink ? " com link configurado" : ""}</span>
                                        ) : null}
                                    </div>
                                    <div className="admin-product-actions">
                                        <button type="button" className="text-button" onClick={() => startEditingProduct(product)} disabled={!canManage}>Editar</button>
                                        <button type="button" className="text-button admin-delete-button" onClick={() => handleDelete("products", product.id)} disabled={!canManage}>Remover</button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                </div>
            ) : null}

            {activeTab === "orders" ? (
                <div className="admin-grid">
                    <section className="contact-card">
                        <div className="section-heading">
                            <h2>{orderForm.id ? "Editar pedido" : "Novo pedido"}</h2>
                            <p>Gerencie pedidos manuais e atualize status de atendimento.</p>
                        </div>
                        <form className="form-grid" onSubmit={handleOrderSubmit}>
                            <label className="field"><span>Cliente</span><input value={orderForm.customer} onChange={(event) => updateOrderField("customer", event.target.value)} required disabled={!canManage} /></label>
                            <label className="field"><span>Total</span><input type="number" step="0.01" value={orderForm.total} onChange={(event) => updateOrderField("total", event.target.value)} required disabled={!canManage} /></label>
                            <label className="field"><span>Status</span><input value={orderForm.status} onChange={(event) => updateOrderField("status", event.target.value)} placeholder="pending, paid, shipped" required disabled={!canManage} /></label>
                            <label className="field"><span>Canal</span><input value={orderForm.channel} onChange={(event) => updateOrderField("channel", event.target.value)} placeholder="WhatsApp" required disabled={!canManage} /></label>
                            <label className="field"><span>Quantidade de itens</span><input type="number" value={orderForm.itemCount} onChange={(event) => updateOrderField("itemCount", event.target.value)} required disabled={!canManage} /></label>
                            <div className="form-actions field-full">
                                <button type="submit" className="primary-button" disabled={isSaving || !canManage}>{isSaving ? "Salvando..." : orderForm.id ? "Atualizar pedido" : "Criar pedido"}</button>
                                <button type="button" className="secondary-button" onClick={resetOrderForm} disabled={!canManage}>Limpar formulario</button>
                            </div>
                        </form>
                    </section>

                    <section className="contact-card">
                        <div className="section-heading">
                            <h2>Pedidos cadastrados</h2>
                            <p>Filtrados por: {searchTerm || "todos"}</p>
                        </div>
                        <div className="admin-product-list">
                            {filteredOrders.map((order) => (
                                <article key={order.id} className="admin-product-card">
                                    <div>
                                        <strong>Pedido #{order.id} â€¢ {order.customer}</strong>
                                        <p>{order.status} â€¢ {order.channel}</p>
                                        <span>{order.itemCount} item(ns) â€¢ {formatCurrency(order.total)}</span>
                                    </div>
                                    <div className="admin-product-actions">
                                        <button type="button" className="text-button" onClick={() => startEditingOrder(order)} disabled={!canManage}>Editar</button>
                                        <button type="button" className="text-button admin-delete-button" onClick={() => handleDelete("orders", order.id)} disabled={!canManage}>Remover</button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                </div>
            ) : null}

            {activeTab === "coupons" ? (
                <div className="admin-grid">
                    <section className="contact-card">
                        <div className="section-heading">
                            <h2>{couponForm.id ? "Editar cupom" : "Novo cupom"}</h2>
                            <p>Cadastre regras promocionais para campanhas e descontos.</p>
                        </div>
                        <form className="form-grid" onSubmit={handleCouponSubmit}>
                            <label className="field"><span>Codigo</span><input value={couponForm.code} onChange={(event) => updateCouponField("code", event.target.value)} required disabled={!canManage} /></label>
                            <label className="field"><span>Tipo</span><input value={couponForm.type} onChange={(event) => updateCouponField("type", event.target.value)} placeholder="percent ou fixed" required disabled={!canManage} /></label>
                            <label className="field"><span>Valor</span><input type="number" step="0.01" value={couponForm.value} onChange={(event) => updateCouponField("value", event.target.value)} required disabled={!canManage} /></label>
                            <label className="field"><span>Pedido minimo</span><input type="number" step="0.01" value={couponForm.minOrder} onChange={(event) => updateCouponField("minOrder", event.target.value)} required disabled={!canManage} /></label>
                            <label className="field"><span>Uso total</span><input type="number" value={couponForm.usageCount} onChange={(event) => updateCouponField("usageCount", event.target.value)} required disabled={!canManage} /></label>
                            <label className="field admin-checkbox-field"><span>Cupom ativo</span><input type="checkbox" checked={couponForm.active} onChange={(event) => updateCouponField("active", event.target.checked)} disabled={!canManage} /></label>
                            <div className="form-actions field-full">
                                <button type="submit" className="primary-button" disabled={isSaving || !canManage}>{isSaving ? "Salvando..." : couponForm.id ? "Atualizar cupom" : "Criar cupom"}</button>
                                <button type="button" className="secondary-button" onClick={resetCouponForm} disabled={!canManage}>Limpar formulario</button>
                            </div>
                        </form>
                    </section>

                    <section className="contact-card">
                        <div className="section-heading">
                            <h2>Cupons cadastrados</h2>
                            <p>Filtrados por: {searchTerm || "todos"}</p>
                        </div>
                        <div className="admin-product-list">
                            {filteredCoupons.map((coupon) => (
                                <article key={coupon.id} className="admin-product-card">
                                    <div>
                                        <strong>{coupon.code}</strong>
                                        <p>{coupon.type} â€¢ {coupon.active ? "ativo" : "inativo"}</p>
                                        <span>Valor {coupon.value} â€¢ minimo {coupon.minOrder} â€¢ uso {coupon.usageCount}</span>
                                    </div>
                                    <div className="admin-product-actions">
                                        <button type="button" className="text-button" onClick={() => startEditingCoupon(coupon)} disabled={!canManage}>Editar</button>
                                        <button type="button" className="text-button admin-delete-button" onClick={() => handleDelete("coupons", coupon.id)} disabled={!canManage}>Remover</button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                </div>
            ) : null}

            {activeTab === "leads" ? (
                <div className="admin-grid admin-grid-single">
                    <section className="contact-card">
                        <div className="section-heading">
                            <h2>Leads recebidos</h2>
                            <p>Filtrados por: {searchTerm || "todos"}. Atualize status ou remova contatos antigos.</p>
                        </div>
                        <div className="admin-product-list">
                            {filteredLeads.map((lead) => (
                                <article key={lead.id} className="admin-product-card admin-lead-card">
                                    <div>
                                        <strong>{lead.name}</strong>
                                        <p>{lead.subject}</p>
                                        <span>{lead.email || "sem email"} â€¢ {lead.phone || "sem telefone"}</span>
                                        <p>{lead.message}</p>
                                        <span>{lead.channel} â€¢ {lead.status}</span>
                                    </div>
                                    <div className="admin-product-actions">
                                        <button type="button" className="text-button" onClick={() => updateLeadStatus(lead, "contacted")} disabled={!canManage}>Marcar contato</button>
                                        <button type="button" className="text-button" onClick={() => updateLeadStatus(lead, "closed")} disabled={!canManage}>Fechar</button>
                                        <button type="button" className="text-button admin-delete-button" onClick={() => handleDelete("leads", lead.id)} disabled={!canManage}>Remover</button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                </div>
            ) : null}

            {isProductModalOpen ? (
                <div className="admin-modal-backdrop" role="presentation" onClick={closeProductModal}>
                    <section
                        className="admin-modal-card"
                        role="dialog"
                        aria-modal="true"
                        aria-label={productForm.id ? "Editar produto" : "Cadastrar produto"}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="admin-modal-header">
                            <div>
                                <p className="section-kicker">Manutenção de produto</p>
                                <h2 className="admin-modal-title">
                                    <Sparkles size={22} />
                                    <span>{productForm.id ? "Editar produto" : "Cadastrar produto"}</span>
                                </h2>
                                <p className="admin-modal-description">
                                    Organize dados comerciais, galeria, preços e formas de pagamento em um só lugar.
                                </p>
                                <div className="admin-modal-meta">
                                    <span>{(productForm.images || []).length} imagem(ns)</span>
                                    <span>Venda {formatCurrency(productForm.price || 0)}</span>
                                    <span>Custo total {formatCurrency(productForm.totalCost || 0)}</span>
                                    <span>Lucro {formatCurrency(estimatedProfit)}</span>
                                </div>
                            </div>
                            <button type="button" className="secondary-button" onClick={closeProductModal}>
                                Fechar
                            </button>
                        </div>

                        <form className="form-grid admin-modal-form" onSubmit={handleProductSubmit}>
                            <AdminFormSection
                                icon={Package2}
                                title="Informações principais"
                                description="Defina nome, categoria, descrição e os atributos visíveis no catálogo."
                            />
                            <label className="field"><span>Nome</span><input value={productForm.name} onChange={(event) => updateProductField("name", event.target.value)} required disabled={!canManage} /></label>
                            <label className="field"><span>Categoria</span><input value={productForm.category} onChange={(event) => updateProductField("category", event.target.value)} required disabled={!canManage} /></label>
                            <label className="field"><span>Subcategoria</span><input value={productForm.subcategory} onChange={(event) => updateProductField("subcategory", event.target.value)} required disabled={!canManage} /></label>
                            <label className="field"><span>Tamanhos</span><input value={productForm.sizes} onChange={(event) => updateProductField("sizes", event.target.value)} placeholder="P, M, G" required disabled={!canManage} /></label>
                            <label className="field"><span>Cores</span><input value={productForm.colors} onChange={(event) => updateProductField("colors", event.target.value)} placeholder="Preto, Areia" required disabled={!canManage} /></label>
                            <label className="field field-full"><span>Descrição</span><textarea value={productForm.description} onChange={(event) => updateProductField("description", event.target.value)} rows={4} required disabled={!canManage} /></label>
                            <AdminFormSection
                                icon={FolderKanban}
                                title="Precificação"
                                description="Controle o valor de venda, referência antiga, custo e taxa aplicada."
                            />
                            <label className="field">
                                <span>Preço de venda</span>
                                <input type="text" inputMode="decimal" value={productForm.price} readOnly disabled={!canManage} />
                                <small className="field-help">Calculado automaticamente com base no custo do produto e na porcentagem sobre vendas.</small>
                                <small className="field-help field-formula">
                                    Formula: {formatCurrency(productForm.costPrice)} x (1 + {formatPercent(productForm.salesFeePercentage)}) = {formatCurrency(productForm.price)}
                                </small>
                            </label>
                            <label className="field"><span>Preço antigo</span><input type="text" inputMode="decimal" value={productForm.oldPrice} onChange={(event) => updateProductField("oldPrice", event.target.value)} required disabled={!canManage} /></label>
                            <label className="field"><span>Custo do produto</span><input type="text" inputMode="decimal" value={productForm.costPrice} onChange={(event) => updateProductField("costPrice", event.target.value)} required disabled={!canManage} /></label>
                            <label className="field"><span>Porcentagem sobre vendas</span><input type="text" inputMode="decimal" value={productForm.salesFeePercentage} onChange={(event) => updateProductField("salesFeePercentage", event.target.value)} required disabled={!canManage} /></label>
                            <label className="field">
                                <span>Custo total</span>
                                <input type="text" inputMode="decimal" value={productForm.totalCost} readOnly disabled />
                                <small className="field-help">Representa o custo base do produto para comparação com o valor final de venda.</small>
                            </label>
                            <label className="field"><span>Selo</span><input value={productForm.badge} onChange={(event) => updateProductField("badge", event.target.value)} placeholder="-30% OFF" disabled={!canManage} /></label>
                            <div className="field field-full admin-profit-summary">
                                <span>Resumo de margem</span>
                                <div className="admin-profit-grid">
                                    <article className="admin-profit-card">
                                        <strong>Lucro estimado</strong>
                                        <p>{formatCurrency(estimatedProfit)}</p>
                                    </article>
                                    <article className={`admin-profit-card is-${marginTone}`}>
                                        <strong>Margem estimada</strong>
                                        <p>{formatPercent(estimatedMarginPercentage)}</p>
                                        <small>
                                            {marginTone === "danger"
                                                ? "Margem muito baixa. Revise custo ou porcentagem."
                                                : marginTone === "warning"
                                                  ? "Margem apertada. Vale revisar a precificação."
                                                  : "Margem saudavel para este produto."}
                                        </small>
                                    </article>
                                </div>
                            </div>
                            <AdminFormSection
                                icon={ImagePlus}
                                title="Galeria do produto"
                                description="Escolha a capa e monte uma apresentação visual mais completa para o catálogo."
                            />
                            <label className="field field-full">
                                <span>Imagens por URL ou data URL</span>
                                <textarea
                                    value={(productForm.images || []).join("\n")}
                                    onChange={(event) => updateProductImagesFromText(event.target.value)}
                                    placeholder={"/assets/product_1.jpg\n/assets/product_2.jpg"}
                                    rows={5}
                                    disabled={!canManage}
                                />
                                <small className="field-help">Uma imagem por linha. Máximo de {MAX_PRODUCT_IMAGES} imagens por produto.</small>
                            </label>
                            <label className="field field-full">
                                <span>Upload de imagens em alta resolução</span>
                                <input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={!canManage} />
                                <small className="field-help">Selecione até {MAX_PRODUCT_IMAGES} imagens. A primeira vira a capa principal do produto.</small>
                            </label>
                            <div className="field field-full admin-image-gallery-editor">
                                <span>Galeria do produto</span>
                                <div className="admin-image-preview">
                                    <button
                                        type="button"
                                        className="admin-image-preview-button"
                                        onClick={() => openImageLightbox(imagePreview)}
                                        aria-label="Ampliar imagem principal do produto"
                                    >
                                        <img src={imagePreview} alt="Preview da imagem principal do produto" />
                                    </button>
                                    <button
                                        type="button"
                                        className="secondary-button admin-image-zoom-trigger"
                                        onClick={() => openImageLightbox(imagePreview)}
                                    >
                                        <Search size={16} />
                                        <span>Ampliar imagem</span>
                                    </button>
                                    <div className="admin-image-preview-actions">
                                        <button
                                            type="button"
                                            className="secondary-button admin-image-switch-button"
                                            onClick={() => focusAdjacentPreviewImage("left")}
                                            disabled={(productForm.images || []).length <= 1}
                                        >
                                            <ChevronLeft size={16} />
                                            <span>Anterior</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="secondary-button admin-image-switch-button"
                                            onClick={() => focusAdjacentPreviewImage("right")}
                                            disabled={(productForm.images || []).length <= 1}
                                        >
                                            <span>Próxima</span>
                                            <ChevronRight size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            className="secondary-button admin-image-remove-current"
                                            onClick={() => removeProductImage(imagePreview)}
                                            disabled={!canManage || !(productForm.images || []).length}
                                        >
                                            Remover atual
                                        </button>
                                    </div>
                                </div>
                                <div className="admin-image-preview-grid">
                                    {(productForm.images || []).map((image, index) => (
                                        <article key={`${image}-${index}`} className={`admin-image-thumb-card ${imagePreview === image ? "is-active" : ""}`}>
                                            <button type="button" className="admin-image-thumb-button" onClick={() => setImagePreview(image)}>
                                                <img src={image} alt={`Imagem ${index + 1} do produto`} />
                                            </button>
                                            <div className="admin-image-thumb-footer">
                                                <span>{index === 0 ? "Capa" : `Imagem ${index + 1}`}</span>
                                                <div className="admin-image-thumb-actions">
                                                    <button
                                                        type="button"
                                                        className="text-button admin-cover-button"
                                                        onClick={() => setProductCoverImage(image)}
                                                        disabled={!canManage || index === 0}
                                                    >
                                                        Definir como capa
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="text-button"
                                                        onClick={() => moveProductImage(image, "left")}
                                                        disabled={!canManage || index === 0}
                                                        aria-label={`Mover imagem ${index + 1} para a esquerda`}
                                                    >
                                                        <ChevronLeft size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="text-button"
                                                        onClick={() => moveProductImage(image, "right")}
                                                        disabled={!canManage || index === (productForm.images || []).length - 1}
                                                        aria-label={`Mover imagem ${index + 1} para a direita`}
                                                    >
                                                        <ChevronRight size={16} />
                                                    </button>
                                                    <button type="button" className="text-button admin-delete-button" onClick={() => removeProductImage(image)} disabled={!canManage}>
                                                        Remover
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </div>
                            <AdminFormSection
                                icon={CreditCard}
                                title="Pagamento e destaque"
                                description="Defina como o cliente pode pagar e se o produto deve receber mais visibilidade."
                            />
                            <div className="field field-full">
                                <span>Formas de pagamento</span>
                                <div className="admin-payment-options">
                                    {PAYMENT_METHOD_OPTIONS.map((method) => (
                                        <label key={method} className="admin-check-chip">
                                            <input
                                                type="checkbox"
                                                checked={productForm.paymentMethods.includes(method)}
                                                onChange={() => togglePaymentMethod(method)}
                                                disabled={!canManage}
                                            />
                                            <span>{method}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <label className="field admin-checkbox-field"><span>Produto em destaque</span><input type="checkbox" checked={productForm.featured} onChange={(event) => updateProductField("featured", event.target.checked)} disabled={!canManage} /></label>
                            <label className="field admin-checkbox-field"><span>Recebimento com Mercado Pago</span><input type="checkbox" checked={productForm.mercadoPagoEnabled} onChange={(event) => updateProductField("mercadoPagoEnabled", event.target.checked)} disabled={!canManage} /></label>
                            <label className="field field-full"><span>Link do Mercado Pago</span><input value={productForm.mercadoPagoLink} onChange={(event) => updateProductField("mercadoPagoLink", event.target.value)} placeholder="https://www.mercadopago.com.br/..." disabled={!canManage || !productForm.mercadoPagoEnabled} /></label>
                            <div className="form-actions field-full admin-modal-actions">
                                <button type="submit" className="primary-button" disabled={isSaving || !canManage}>{isSaving ? "Salvando..." : productForm.id ? "Atualizar produto" : "Criar produto"}</button>
                                <button type="button" className="secondary-button" onClick={closeProductModal}>Cancelar</button>
                            </div>
                        </form>
                    </section>
                </div>
            ) : null}

            {zoomedImage ? (
                <div className="admin-lightbox-backdrop" role="presentation" onClick={closeImageLightbox}>
                    <section
                        className="admin-lightbox-card"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Imagem ampliada do produto"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button type="button" className="admin-lightbox-close" onClick={closeImageLightbox} aria-label="Fechar imagem ampliada">
                            <X size={18} />
                        </button>
                        <img src={zoomedImage} alt="Imagem ampliada do produto" className="admin-lightbox-image" />
                    </section>
                </div>
            ) : null}
        </div>
    );
}
