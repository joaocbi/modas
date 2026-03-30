 "use client";

import { useState } from "react";
import { getProductWhatsAppLink } from "../data/store";

function formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
}

function getProductImages(product) {
    const images = Array.isArray(product.images) && product.images.length ? product.images : [product.image].filter(Boolean);
    return images.slice(0, 10);
}

function ProductCard({ product, showDescription }) {
    const images = getProductImages(product);
    const [activeImage, setActiveImage] = useState(images[0]);
    const [isDescriptionVisible, setIsDescriptionVisible] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [zoomOrigin, setZoomOrigin] = useState("50% 50%");

    function handleSelectImage(image) {
        setActiveImage(image);
        setIsDescriptionVisible(true);
        console.log("[ProductGrid] Product image selected.", {
            productId: product.id,
            productName: product.name,
        });
    }

    function openImageLightbox(image) {
        handleSelectImage(image);
        setIsLightboxOpen(true);
    }

    function closeImageLightbox() {
        setIsLightboxOpen(false);
        setZoomOrigin("50% 50%");
    }

    function handleLightboxMouseMove(event) {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        setZoomOrigin(`${x}% ${y}%`);
    }

    return (
        <>
            <article className="product-card">
                <div className="product-gallery">
                    <button
                        type="button"
                        className="product-image-button"
                        onClick={() => openImageLightbox(activeImage)}
                        aria-label={`Ampliar imagem de ${product.name}`}
                    >
                        <div className="product-image-wrap">
                            <img src={activeImage} alt={product.name} className="product-image" />
                            <span className="product-badge">{product.badge}</span>
                        </div>
                    </button>

                    {images.length > 1 ? (
                        <div className="product-thumbnail-row">
                            {images.map((image, index) => (
                                <button
                                    key={`${product.id}-${index}`}
                                    type="button"
                                    className={`product-thumbnail ${activeImage === image ? "is-active" : ""}`}
                                    onClick={() => handleSelectImage(image)}
                                    aria-label={`Selecionar imagem ${index + 1} de ${product.name}`}
                                >
                                    <img src={image} alt={`${product.name} ${index + 1}`} />
                                </button>
                            ))}
                        </div>
                    ) : null}

                    {showDescription ? (
                        <div className={`product-description-panel ${isDescriptionVisible ? "is-visible" : ""}`}>
                            <strong>Descrição do produto</strong>
                            <p>
                                {isDescriptionVisible
                                    ? product.description
                                    : "Clique em uma imagem para visualizar a descrição em destaque."}
                            </p>
                        </div>
                    ) : null}
                </div>

                <div className="product-body">
                    <p className="product-category">{product.category}</p>
                    {product.subcategory ? <p className="product-meta">{product.subcategory}</p> : null}
                    <h3>{product.name}</h3>
                    <p className="product-meta">Tamanhos: {product.sizes.join(" • ")}</p>
                    <p className="product-meta">Cores: {product.colors.join(" • ")}</p>
                    {product.paymentMethods?.length ? (
                        <p className="product-meta">Pagamento: {product.paymentMethods.join(" • ")}</p>
                    ) : null}

                    <div className="product-prices">
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
                        <a href="/contato" className="text-button">
                            Tirar dúvidas
                        </a>
                    </div>
                </div>
            </article>

            {isLightboxOpen ? (
                <div className="product-lightbox-backdrop" role="presentation" onClick={closeImageLightbox}>
                    <div className="product-lightbox-card" role="dialog" aria-modal="true" aria-label={`Imagem ampliada de ${product.name}`} onClick={(event) => event.stopPropagation()}>
                        <button type="button" className="product-lightbox-close" onClick={closeImageLightbox}>
                            Fechar
                        </button>
                        <div className="product-lightbox-image-wrap" onMouseMove={handleLightboxMouseMove} onMouseLeave={() => setZoomOrigin("50% 50%")}>
                            <img
                                src={activeImage}
                                alt={`Imagem ampliada de ${product.name}`}
                                className="product-lightbox-image"
                                style={{ transformOrigin: zoomOrigin }}
                            />
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}

export function ProductGrid({ items, showDescription = true }) {
    return (
        <div className="product-grid">
            {items.map((product) => (
                <ProductCard key={product.id} product={product} showDescription={showDescription} />
            ))}
        </div>
    );
}
