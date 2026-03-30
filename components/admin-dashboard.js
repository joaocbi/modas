"use client";

import { useEffect, useMemo, useState } from "react";

const PAYMENT_METHOD_OPTIONS = ["Pix", "Cartão de crédito", "Cartão de débito", "Boleto", "Mercado Pago"];

function calculateTotalCost(price, costPrice, salesFeePercentage) {
    return Number((Number(costPrice || 0) + Number(price || 0) * (Number(salesFeePercentage || 0) / 100)).toFixed(2));
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
        image: "/assets/product_1.jpg",
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
    }).format(Number(value || 0));
}

function formatPercent(value) {
    return `${Number(value || 0).toFixed(2).replace(".", ",")}%`;
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
        setImagePreview("/assets/product_1.jpg");
    }

    function openNewProductModal() {
        resetProductForm();
        setIsProductModalOpen(true);
        showStatus("success", "Preencha os dados para cadastrar um novo produto.");
    }

    function closeProductModal() {
        setIsProductModalOpen(false);
        resetProductForm();
    }

    function resetOrderForm() {
        setOrderForm(getEmptyOrderForm());
    }

    function resetCouponForm() {
        setCouponForm(getEmptyCouponForm());
    }

    function updateProductField(name, value) {
        setProductForm((current) => {
            const nextProductForm = { ...current, [name]: value };
            if (["price", "costPrice", "salesFeePercentage"].includes(name)) {
                nextProductForm.totalCost = String(
                    calculateTotalCost(nextProductForm.price, nextProductForm.costPrice, nextProductForm.salesFeePercentage)
                );
            }
            return nextProductForm;
        });

        if (name === "image") {
            setImagePreview(String(value || "") || "/assets/product_1.jpg");
        }
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
            price: String(product.price),
            oldPrice: String(product.oldPrice),
            costPrice: String(product.costPrice || 0),
            salesFeePercentage: String(product.salesFeePercentage || 0),
            totalCost: String(product.totalCost || 0),
            mercadoPagoEnabled: Boolean(product.mercadoPagoEnabled),
            mercadoPagoLink: product.mercadoPagoLink || "",
            badge: product.badge,
            image: product.image,
            featured: Boolean(product.featured),
        });
        setImagePreview(product.image || "/assets/product_1.jpg");
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
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const imageSource = String(reader.result || "");
            updateProductField("image", imageSource);
            showStatus("success", "Imagem carregada com sucesso para este produto.");
        };
        reader.onerror = () => {
            showStatus("warning", "Nao foi possivel carregar a imagem selecionada.");
        };
        reader.readAsDataURL(file);
    }

    async function handleProductSubmit(event) {
        event.preventDefault();
        setIsSaving(true);
        setStatusMessage("");

        try {
            const isEditing = Boolean(productForm.id);
            const payload = {
                ...productForm,
                price: Number(productForm.price || 0),
                oldPrice: Number(productForm.oldPrice || 0),
                costPrice: Number(productForm.costPrice || 0),
                salesFeePercentage: Number(productForm.salesFeePercentage || 0),
                totalCost: Number(productForm.totalCost || 0),
                featured: Boolean(productForm.featured),
                mercadoPagoEnabled: Boolean(productForm.mercadoPagoEnabled),
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
            showStatus("success", isEditing ? "Produto atualizado com sucesso." : "Produto criado com sucesso.");
        } catch (error) {
            console.log("[AdminDashboard] Failed to save product.", error);
            showStatus("warning", "Ocorreu um erro ao salvar o produto.");
        } finally {
            setIsSaving(false);
        }
    }

    useEffect(() => {
        if (!isProductModalOpen) {
            return undefined;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isProductModalOpen]);

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
                                <h2>{productForm.id ? "Editar produto" : "Cadastrar produto"}</h2>
                            </div>
                            <button type="button" className="secondary-button" onClick={closeProductModal}>
                                Fechar
                            </button>
                        </div>

                        <form className="form-grid" onSubmit={handleProductSubmit}>
                            <label className="field"><span>Nome</span><input value={productForm.name} onChange={(event) => updateProductField("name", event.target.value)} required disabled={!canManage} /></label>
                            <label className="field"><span>Categoria</span><input value={productForm.category} onChange={(event) => updateProductField("category", event.target.value)} required disabled={!canManage} /></label>
                            <label className="field"><span>Subcategoria</span><input value={productForm.subcategory} onChange={(event) => updateProductField("subcategory", event.target.value)} required disabled={!canManage} /></label>
                            <label className="field"><span>Tamanhos</span><input value={productForm.sizes} onChange={(event) => updateProductField("sizes", event.target.value)} placeholder="P, M, G" required disabled={!canManage} /></label>
                            <label className="field"><span>Cores</span><input value={productForm.colors} onChange={(event) => updateProductField("colors", event.target.value)} placeholder="Preto, Areia" required disabled={!canManage} /></label>
                            <label className="field field-full"><span>Descrição</span><textarea value={productForm.description} onChange={(event) => updateProductField("description", event.target.value)} rows={4} required disabled={!canManage} /></label>
                            <label className="field"><span>Preço de venda</span><input type="number" step="0.01" value={productForm.price} onChange={(event) => updateProductField("price", event.target.value)} required disabled={!canManage} /></label>
                            <label className="field"><span>Preço antigo</span><input type="number" step="0.01" value={productForm.oldPrice} onChange={(event) => updateProductField("oldPrice", event.target.value)} required disabled={!canManage} /></label>
                            <label className="field"><span>Custo do produto</span><input type="number" step="0.01" value={productForm.costPrice} onChange={(event) => updateProductField("costPrice", event.target.value)} required disabled={!canManage} /></label>
                            <label className="field"><span>Porcentagem sobre vendas</span><input type="number" step="0.01" value={productForm.salesFeePercentage} onChange={(event) => updateProductField("salesFeePercentage", event.target.value)} required disabled={!canManage} /></label>
                            <label className="field"><span>Custo total</span><input type="number" step="0.01" value={productForm.totalCost} readOnly disabled /></label>
                            <label className="field"><span>Selo</span><input value={productForm.badge} onChange={(event) => updateProductField("badge", event.target.value)} placeholder="-30% OFF" disabled={!canManage} /></label>
                            <label className="field field-full"><span>Imagem por URL ou data URL</span><input value={productForm.image} onChange={(event) => updateProductField("image", event.target.value)} placeholder="/assets/product_1.jpg" required disabled={!canManage} /></label>
                            <label className="field"><span>Upload de imagem</span><input type="file" accept="image/*" onChange={handleImageUpload} disabled={!canManage} /></label>
                            <div className="field admin-image-preview">
                                <span>Preview</span>
                                <img src={imagePreview} alt="Preview da imagem do produto" />
                            </div>
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
                            <div className="form-actions field-full">
                                <button type="submit" className="primary-button" disabled={isSaving || !canManage}>{isSaving ? "Salvando..." : productForm.id ? "Atualizar produto" : "Criar produto"}</button>
                                <button type="button" className="secondary-button" onClick={closeProductModal}>Cancelar</button>
                            </div>
                        </form>
                    </section>
                </div>
            ) : null}
        </div>
    );
}
