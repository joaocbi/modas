"use client";

import { useMemo, useState } from "react";

function getEmptyForm() {
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

export function AdminDashboard({ initialProducts, adminEmail, storageMode, canManage }) {
    const [products, setProducts] = useState(initialProducts);
    const [formValues, setFormValues] = useState(getEmptyForm());
    const [statusMessage, setStatusMessage] = useState("");
    const [statusType, setStatusType] = useState("success");
    const [isSaving, setIsSaving] = useState(false);

    const totalFeatured = useMemo(
        () => products.filter((product) => product.featured).length,
        [products]
    );

    function updateField(name, value) {
        setFormValues((currentValues) => ({
            ...currentValues,
            [name]: value,
        }));
    }

    function startEditing(product) {
        setFormValues({
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
        setStatusMessage(`Editando ${product.name}.`);
        setStatusType("success");
    }

    function resetForm() {
        setFormValues(getEmptyForm());
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setIsSaving(true);
        setStatusMessage("");

        const payload = {
            ...formValues,
            price: Number(formValues.price || 0),
            oldPrice: Number(formValues.oldPrice || 0),
            featured: Boolean(formValues.featured),
        };

        try {
            const isEditing = Boolean(formValues.id);
            const response = await fetch("/api/admin/products", {
                method: isEditing ? "PATCH" : "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            console.log("[AdminDashboard] Product save response.", data);

            if (!response.ok) {
                setStatusType("warning");
                setStatusMessage(data.message || "Não foi possível salvar o produto.");
                return;
            }

            setProducts((currentProducts) => {
                if (!isEditing) {
                    return [...currentProducts, data.product];
                }

                return currentProducts.map((product) =>
                    Number(product.id) === Number(data.product.id) ? data.product : product
                );
            });

            setStatusType("success");
            setStatusMessage(isEditing ? "Produto atualizado com sucesso." : "Produto criado com sucesso.");
            resetForm();
        } catch (error) {
            console.log("[AdminDashboard] Failed to save product.", error);
            setStatusType("warning");
            setStatusMessage("Ocorreu um erro ao salvar o produto.");
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete(id) {
        const confirmed = window.confirm("Deseja remover este produto?");
        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/products?id=${id}`, {
                method: "DELETE",
            });
            const data = await response.json();
            console.log("[AdminDashboard] Product delete response.", data);

            if (!response.ok) {
                setStatusType("warning");
                setStatusMessage(data.message || "Não foi possível remover o produto.");
                return;
            }

            setProducts((currentProducts) => currentProducts.filter((product) => Number(product.id) !== Number(id)));
            setStatusType("success");
            setStatusMessage("Produto removido com sucesso.");
        } catch (error) {
            console.log("[AdminDashboard] Failed to delete product.", error);
            setStatusType("warning");
            setStatusMessage("Ocorreu um erro ao remover o produto.");
        }
    }

    async function handleLogout() {
        await fetch("/api/admin/logout", {
            method: "POST",
        });
        window.location.href = "/admin/login";
    }

    return (
        <div className="admin-shell">
            <div className="admin-topbar">
                <div>
                    <p className="section-kicker">Painel seguro</p>
                    <h1>Gerenciar produtos</h1>
                    <p>Logado como {adminEmail}</p>
                </div>
                <button type="button" className="secondary-button" onClick={handleLogout}>
                    Sair
                </button>
            </div>

            <div className="admin-storage-banner">
                <strong>Modo de armazenamento:</strong> {storageMode === "database" ? "PostgreSQL com Prisma" : "Fallback local em arquivo"}
                {!canManage ? " • leitura apenas até configurar DATABASE_URL" : ""}
            </div>

            <div className="admin-metrics">
                <article className="content-card">
                    <strong>Total de produtos</strong>
                    <h2>{products.length}</h2>
                </article>
                <article className="content-card">
                    <strong>Destaques ativos</strong>
                    <h2>{totalFeatured}</h2>
                </article>
            </div>

            <div className="admin-grid">
                <section className="contact-card">
                    <div className="section-heading">
                        <h2>{formValues.id ? "Editar produto" : "Novo produto"}</h2>
                        <p>Atualize o catálogo da vitrine com dados reais.</p>
                    </div>

                    <form className="form-grid" onSubmit={handleSubmit}>
                        <label className="field">
                            <span>Nome</span>
                            <input value={formValues.name} onChange={(event) => updateField("name", event.target.value)} required disabled={!canManage} />
                        </label>
                        <label className="field">
                            <span>Categoria</span>
                            <input value={formValues.category} onChange={(event) => updateField("category", event.target.value)} required disabled={!canManage} />
                        </label>
                        <label className="field field-full">
                            <span>Descrição</span>
                            <textarea value={formValues.description} onChange={(event) => updateField("description", event.target.value)} rows={4} required disabled={!canManage} />
                        </label>
                        <label className="field">
                            <span>Tamanhos</span>
                            <input value={formValues.sizes} onChange={(event) => updateField("sizes", event.target.value)} placeholder="P, M, G" required disabled={!canManage} />
                        </label>
                        <label className="field">
                            <span>Cores</span>
                            <input value={formValues.colors} onChange={(event) => updateField("colors", event.target.value)} placeholder="Preto, Areia" required disabled={!canManage} />
                        </label>
                        <label className="field">
                            <span>Preço atual</span>
                            <input type="number" step="0.01" value={formValues.price} onChange={(event) => updateField("price", event.target.value)} required disabled={!canManage} />
                        </label>
                        <label className="field">
                            <span>Preço antigo</span>
                            <input type="number" step="0.01" value={formValues.oldPrice} onChange={(event) => updateField("oldPrice", event.target.value)} required disabled={!canManage} />
                        </label>
                        <label className="field">
                            <span>Selo</span>
                            <input value={formValues.badge} onChange={(event) => updateField("badge", event.target.value)} placeholder="-30% OFF" disabled={!canManage} />
                        </label>
                        <label className="field">
                            <span>Imagem</span>
                            <input value={formValues.image} onChange={(event) => updateField("image", event.target.value)} placeholder="/assets/product_1.jpg" required disabled={!canManage} />
                        </label>
                        <label className="field admin-checkbox-field">
                            <span>Produto em destaque</span>
                            <input
                                type="checkbox"
                                checked={formValues.featured}
                                onChange={(event) => updateField("featured", event.target.checked)}
                                disabled={!canManage}
                            />
                        </label>

                        <div className="form-actions field-full">
                            <button type="submit" className="primary-button" disabled={isSaving || !canManage}>
                                {isSaving ? "Salvando..." : formValues.id ? "Atualizar produto" : "Criar produto"}
                            </button>
                            <button type="button" className="secondary-button" onClick={resetForm} disabled={!canManage}>
                                Limpar formulário
                            </button>
                        </div>
                    </form>

                    {statusMessage ? <p className={`form-status form-status-${statusType}`}>{statusMessage}</p> : null}
                </section>

                <section className="contact-card">
                    <div className="section-heading">
                        <h2>Produtos cadastrados</h2>
                        <p>Clique em editar para carregar os dados no formulário.</p>
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
                                    <button type="button" className="text-button" onClick={() => startEditing(product)} disabled={!canManage}>
                                        Editar
                                    </button>
                                    <button type="button" className="text-button admin-delete-button" onClick={() => handleDelete(product.id)} disabled={!canManage}>
                                        Remover
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
