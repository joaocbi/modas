"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getProductWhatsAppLink } from "../data/store";
import { buildProductPath, getPrimaryColorValue } from "../lib/product-utils";

function formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(Number(value || 0));
}

function getProductImages(product) {
    const images = Array.isArray(product.images) && product.images.length ? product.images : [product.image].filter(Boolean);
    return images.slice(0, 12);
}

export function ProductDetailView({ product, variations }) {
    const images = useMemo(() => getProductImages(product), [product]);
    const [activeImage, setActiveImage] = useState(images[0] || product.image);

    return (
        <div className="product-detail-layout">
            <section className="content-card product-detail-gallery-card">
                <div className="product-detail-main-image-wrap">
                    <img src={activeImage} alt={product.name} className="product-detail-main-image" />
                    {product.badge ? <span className="product-badge">{product.badge}</span> : null}
                </div>

                {images.length > 1 ? (
                    <div className="product-detail-thumb-grid">
                        {images.map((image, index) => (
                            <button
                                key={`${product.id}-${index}`}
                                type="button"
                                className={`product-detail-thumb ${activeImage === image ? "is-active" : ""}`}
                                onClick={() => setActiveImage(image)}
                                aria-label={`Selecionar imagem ${index + 1} de ${product.name}`}
                            >
                                <img src={image} alt={`${product.name} ${index + 1}`} />
                            </button>
                        ))}
                    </div>
                ) : null}
            </section>

            <section className="content-card product-detail-info-card">
                <p className="section-kicker">{product.category}</p>
                <h1>{product.name}</h1>
                {product.subcategory ? <p className="product-detail-subcategory">{product.subcategory}</p> : null}
                <p className="product-detail-description">{product.description}</p>

                {variations.length > 1 ? (
                    <div className="product-detail-variation-block">
                        <strong>Cores disponíveis</strong>
                        <div className="product-variation-selector">
                            {variations.map((variation) => {
                                const variationColor = getPrimaryColorValue(variation) || variation.name;
                                const isActiveVariation = Number(variation.id) === Number(product.id);

                                return (
                                    <Link
                                        key={variation.id}
                                        href={buildProductPath(variation)}
                                        className={`product-variation-chip ${isActiveVariation ? "is-active" : ""}`}
                                        aria-current={isActiveVariation ? "page" : undefined}
                                    >
                                        <span className="product-variation-swatch" />
                                        <span>{variationColor}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ) : null}

                <div className="product-detail-meta-grid">
                    <article>
                        <strong>Cor principal</strong>
                        <span>{getPrimaryColorValue(product) || "Consulte a equipe"}</span>
                    </article>
                    <article>
                        <strong>Tamanhos</strong>
                        <span>{product.sizes.join(" • ")}</span>
                    </article>
                    <article>
                        <strong>Cores cadastradas</strong>
                        <span>{product.colors.join(" • ")}</span>
                    </article>
                    <article>
                        <strong>Pagamento</strong>
                        <span>{product.paymentMethods.join(" • ")}</span>
                    </article>
                </div>

                <div className="product-prices product-detail-prices">
                    <strong>{formatCurrency(product.price)}</strong>
                    <span>{formatCurrency(product.oldPrice)}</span>
                </div>

                <div className="product-actions">
                    <a href={getProductWhatsAppLink(product)} target="_blank" rel="noreferrer" className="primary-button">
                        Comprar no WhatsApp
                    </a>
                    {product.mercadoPagoEnabled && product.mercadoPagoLink ? (
                        <a href={product.mercadoPagoLink} target="_blank" rel="noreferrer" className="secondary-button">
                            Pagar com Mercado Pago
                        </a>
                    ) : null}
                    <Link href="/produtos" className="text-button">
                        Voltar ao catálogo
                    </Link>
                </div>
            </section>
        </div>
    );
}
