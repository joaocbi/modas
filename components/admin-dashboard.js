"use client";

import { useMemo, useState } from "react";

function getEmptyProductForm() {
    return {
        id: "",
        name: "",
        description: "",
        category: "",
        sizes: "",
        colors: "",
        price: "",
        oldPrice: "",
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

function MetricCard({ label, value }) {
    return (
        <article className="content-card">
            <strong>{label}</strong>
            <h2>{value}</h2>
        </article>
    );
}

export function AdminDashboard({ initialProducts, initialOrders, initialCoupons, adminEmail, storageMode, canManage }) {
    const [products, setProducts] = useState(initialProducts);
    const [orders, setOrders] = useState(initialOrders);
    const [coupons, setCoupons] = useState(initialCoupons);
    const [productForm, setProductForm] = useState(getEmptyProductForm());
    const [orderForm, setOrderForm] = useState(getEmptyOrderForm());
    const [couponForm, setCouponForm] = useState(getEmptyCouponForm());
    const [statusMessage, setStatusMessage] = useState("");
    const [statusType, setStatusType] = useState("success");
    const [activeTab, setActiveTab] = useState("products");
    const [isSaving, setIsSaving] = useState(false);

    const totalFeatured = useMemo(() => products.filter((product) => product.featured).length, [products]);
    const totalRevenue = useMemo(() => orders.reduce((sum, order) => sum + Number(order.total || 0), 0), [orders]);
    const activeCoupons = useMemo(() => coupons.filter((coupon) => coupon.active).length, [coupons]);

    function showStatus(type, message) {
        setStatusType(type);
        setStatusMessage(message);
    }

    function updateProductField(name, value) {
        setProductForm((current) => ({ ...current, [name]: value }));
    }

    function updateOrderField(name, value) {
        setOrderForm((current) => ({ ...current, [name]: value }));
    }

    function updateCouponField(name, value) {
        setCouponForm((current) => ({ ...current, [name]: value }));
    }

    function resetProductForm() {
        setProductForm(getEmptyProductForm());
    }

    function resetOrderForm() {
        setOrderForm(getEmptyOrderForm());
    }

    function resetCouponForm() {
        setCouponForm(getEmptyCouponForm());
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
            sizes: product.sizes.join(", "),
            colors: product.colors.join(", "),
            price: String(product.price),
            oldPrice: String(product.oldPrice),
            badge: product.badge,
            image: product.image,
            featured: Boolean(product.featured),
        });
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
                featured: Boolean(productForm.featured),
            };
            const { response, data } = await sendAdminRequest("/api/admin/products", isEditing ? "PATCH" : "POST", payload);
            console.log("[AdminDashboard] Product response.", data);

            if (!response.ok) {
                showStatus("warning", data.message || "NÃ£o foi possÃ­vel salvar o produto.");
                return;
            }

            setProducts((currentProducts) =>
                isEditing
                    ? currentProducts.map((product) => (Number(product.id) === Number(data.product.id) ? data.product : product))
                    : [...currentProducts, data.product]
            );
            resetProductForm();
            showStatus("success", isEditing ? "Produto atualizado com sucesso." : "Produto criado com sucesso.");
        } catch (error) {
            console.log("[AdminDashboard] Failed to save product.", error);
            showStatus("warning", "Ocorreu um erro ao salvar o produto.");
        } finally {
            setIsSaving(false);
        }
    }

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
                showStatus("warning", data.message || "NÃ£o foi possÃ­vel salvar o pedido.");
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
                showStatus("warning", data.message || "NÃ£o foi possÃ­vel salvar o cupom.");
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

    async function handleDelete(entity, id) {
        if (!window.confirm("Deseja remover este item?")) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/${entity}?id=${id}`, { method: "DELETE" });
            const data = await response.json();
            console.log("[AdminDashboard] Delete response.", { entity, data });

            if (!response.ok) {
                showStatus("warning", data.message || "NÃ£o foi possÃ­vel remover o item.");
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
                {!canManage ? " â€¢ leitura apenas atÃ© configurar DATABASE_URL" : ""}
            </div>

            <div className="admin-metrics">
                <MetricCard label="Total de produtos" value={products.length} />
                <MetricCard label="Destaques ativos" value={totalFeatured} />
                <MetricCard label="Pedidos cadastrados" value={orders.length} />
                <MetricCard label="Receita total" value={`R$ ${totalRevenue.toFixed(2).replace(".", ",")}`} />
                <MetricCard label="Cupons ativos" value={activeCoupons} />
            </div>

            <div className="admin-tabs">
                <button type="button" className={`admin-tab ${activeTab === "products" ? "is-active" : ""}`} onClick={() => setActiveTab("products")}>
                    Produtos
                </button>
                <button type="button" className={`admin-tab ${activeTab === "orders" ? "is-active" : ""}`} onClick={() => setActiveTab("orders")}>
                    Pedidos
                </button>
                <button type="button" className={`admin-tab ${activeTab === "coupons" ? "is-active" : ""}`} onClick={() => setActiveTab("coupons")}>
                    Cupons
                </button>
            </div>

            {statusMessage ? <p className={`form-status form-status-${statusType}`}>{statusMessage}</p> : null}

            {activeTab === "products" ? (
                <div className="admin-grid">
                    <section className="contact-card">
                        <div className="section-heading">
                            <h2>{productForm.id ? "Editar produto" : "Novo produto"}</h2>
                            <p>Atualize o catÃ¡logo da vitrine com dados reais.</p>
                        </div>

                        <form className="form-grid" onSubmit={handleProductSubmit}>
                            <label className="field"><span>Nome</span><input value={productForm.name} onChange={(event) => updateProductField("name", event.target.value)} required disabled={!canManage} /></label>
                            <label className="field"><span>Categoria</span><input value={productForm.category} onChange={(event) => updateProductField("category", event.target.value)} required disabled={!canManage} /></label>
                            <label className="field field-full"><span>DescriÃ§Ã£o</span><textarea value={productForm.description} onChange={(event) => updateProductField("description", event.target.value)} rows={4} required disabled={!canManage} /></label>
                            <label className="field"><span>Tamanhos</span><input value={productForm.sizes} onChange={(event) => updateProductField("sizes", event.target.value)} placeholder="P, M, G" required disabled={!canManage} /></label>
                            <label className="field"><span>Cores</span><input value={productForm.colors} onChange={(event) => updateProductField("colors", event.target.value)} placeholder="Preto, Areia" required disabled={!canManage} /></label>
                            <label className="field"><span>PreÃ§o atual</span><input type="number" step="0.01" value={productForm.price} onChange={(event) => updateProductField("price", event.target.value)} required disabled={!canManage} /></label>
                            <label className="field"><span>PreÃ§o antigo</span><input type="number" step="0.01" value={productForm.oldPrice} onChange={(event) => updateProductField("oldPrice", event.target.value)} required disabled={!canManage} /></label>
                            <label className="field"><span>Selo</span><input value={productForm.badge} onChange={(event) => updateProductField("badge", event.target.value)} placeholder="-30% OFF" disabled={!canManage} /></label>
                            <label className="field"><span>Imagem</span><input value={productForm.image} onChange={(event) => updateProductField("image", event.target.value)} placeholder="/assets/product_1.jpg" required disabled={!canManage} /></label>
                            <label className="field admin-checkbox-field"><span>Produto em destaque</span><input type="checkbox" checked={productForm.featured} onChange={(event) => updateProductField("featured", event.target.checked)} disabled={!canManage} /></label>
                            <div className="form-actions field-full">
                                <button type="submit" className="primary-button" disabled={isSaving || !canManage}>{isSaving ? "Salvando..." : productForm.id ? "Atualizar produto" : "Criar produto"}</button>
                                <button type="button" className="secondary-button" onClick={resetProductForm} disabled={!canManage}>Limpar formulÃ¡rio</button>
                            </div>
                        </form>
                    </section>

                    <section className="contact-card">
                        <div className="section-heading">
                            <h2>Produtos cadastrados</h2>
                            <p>Clique em editar para carregar os dados no formulÃ¡rio.</p>
                        </div>
                        <div className="admin-product-list">
                            {products.map((product) => (
                                <article key={product.id} className="admin-product-card">
                                    <div>
                                        <strong>{product.name}</strong>
                                        <p>{product.category}</p>
                                        <span>{product.image}</span>
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
                                <button type="button" className="secondary-button" onClick={resetOrderForm} disabled={!canManage}>Limpar formulÃ¡rio</button>
                            </div>
                        </form>
                    </section>

                    <section className="contact-card">
                        <div className="section-heading">
                            <h2>Pedidos cadastrados</h2>
                            <p>Use para acompanhar e ajustar status operacionais.</p>
                        </div>
                        <div className="admin-product-list">
                            {orders.map((order) => (
                                <article key={order.id} className="admin-product-card">
                                    <div>
                                        <strong>Pedido #{order.id} â€¢ {order.customer}</strong>
                                        <p>{order.status} â€¢ {order.channel}</p>
                                        <span>{order.itemCount} item(ns) â€¢ R$ {Number(order.total).toFixed(2).replace(".", ",")}</span>
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
                            <label className="field"><span>CÃ³digo</span><input value={couponForm.code} onChange={(event) => updateCouponField("code", event.target.value)} required disabled={!canManage} /></label>
                            <label className="field"><span>Tipo</span><input value={couponForm.type} onChange={(event) => updateCouponField("type", event.target.value)} placeholder="percent ou fixed" required disabled={!canManage} /></label>
                            <label className="field"><span>Valor</span><input type="number" step="0.01" value={couponForm.value} onChange={(event) => updateCouponField("value", event.target.value)} required disabled={!canManage} /></label>
                            <label className="field"><span>Pedido mÃ­nimo</span><input type="number" step="0.01" value={couponForm.minOrder} onChange={(event) => updateCouponField("minOrder", event.target.value)} required disabled={!canManage} /></label>
                            <label className="field"><span>Uso total</span><input type="number" value={couponForm.usageCount} onChange={(event) => updateCouponField("usageCount", event.target.value)} required disabled={!canManage} /></label>
                            <label className="field admin-checkbox-field"><span>Cupom ativo</span><input type="checkbox" checked={couponForm.active} onChange={(event) => updateCouponField("active", event.target.checked)} disabled={!canManage} /></label>
                            <div className="form-actions field-full">
                                <button type="submit" className="primary-button" disabled={isSaving || !canManage}>{isSaving ? "Salvando..." : couponForm.id ? "Atualizar cupom" : "Criar cupom"}</button>
                                <button type="button" className="secondary-button" onClick={resetCouponForm} disabled={!canManage}>Limpar formulÃ¡rio</button>
                            </div>
                        </form>
                    </section>

                    <section className="contact-card">
                        <div className="section-heading">
                            <h2>Cupons cadastrados</h2>
                            <p>Controle campanhas, pedido mÃ­nimo e uso total.</p>
                        </div>
                        <div className="admin-product-list">
                            {coupons.map((coupon) => (
                                <article key={coupon.id} className="admin-product-card">
                                    <div>
                                        <strong>{coupon.code}</strong>
                                        <p>{coupon.type} â€¢ {coupon.active ? "ativo" : "inativo"}</p>
                                        <span>Valor {coupon.value} â€¢ mÃ­nimo {coupon.minOrder} â€¢ uso {coupon.usageCount}</span>
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
        </div>
    );
}
