"use client";

import { useEffect, useRef, useState } from "react";
import { getProductWhatsAppLink } from "../data/store";

function formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
}

function getProductImages(product) {
    const images = Array.isArray(product.images) && product.images.length ? product.images : [product.image].filter(Boolean);
    return images.slice(0, 12);
}

function ProductCard({ product, showDescription, descriptionMode }) {
    const images = getProductImages(product);
    const [activeImage, setActiveImage] = useState(images[0]);
    const [isDescriptionVisible, setIsDescriptionVisible] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [zoomOrigin, setZoomOrigin] = useState("50% 50%");
    const cardRef = useRef(null);
    const isOverlayDescription = descriptionMode === "overlay";

    useEffect(() => {
        if (!isOverlayDescription || !isDescriptionVisible) {
            return undefined;
        }

        function handlePointerDown(event) {
            if (!cardRef.current?.contains(event.target)) {
                setIsDescriptionVisible(false);
                console.log("[ProductGrid] Product description closed by outside click.", {
                    productId: product.id,
                    productName: product.name,
                });
            }
        }

        document.addEventListener("pointerdown", handlePointerDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
        };
    }, [isDescriptionVisible, isOverlayDescription, product.id, product.name]);

    function handleSelectImage(image) {
        setActiveImage(image);
        setIsDescriptionVisible(true);
        console.log("[ProductGrid] Product image selected.", {
            productId: product.id,
            productName: product.name,
        });
    }

    function handlePrimaryImageClick() {
        if (isOverlayDescription) {
            setIsDescriptionVisible((currentValue) => {
                const nextValue = !currentValue;

                console.log("[ProductGrid] Product description toggled from main image.", {
                    productId: product.id,
                    productName: product.name,
                    isVisible: nextValue,
                });

                return nextValue;
            });

            return;
        }

        openImageLightbox(activeImage);
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

    function handleCardMouseLeave() {
        if (!isOverlayDescription || !isDescriptionVisible) {
            return;
        }

        setIsDescriptionVisible(false);
        console.log("[ProductGrid] Product description hidden by mouse leave.", {
            productId: product.id,
            productName: product.name,
        });
    }

    function handleCardBlur(event) {
        if (!isOverlayDescription || event.currentTarget.contains(event.relatedTarget)) {
            return;
        }

        setIsDescriptionVisible(false);
        console.log("[ProductGrid] Product description hidden by focus out.", {
            productId: product.id,
            productName: product.name,
        });
    }

    return (
        <>
            <article ref={cardRef} className="product-card" onMouseLeave={handleCardMouseLeave} onBlur={handleCardBlur}>
                <div className="product-gallery">
                    <button
                        type="button"
                        className="product-image-button"
                        onClick={handlePrimaryImageClick}
                        aria-label={isOverlayDescription ? `Exibir descrição de ${product.name}` : `Ampliar imagem de ${product.name}`}
                        aria-expanded={isOverlayDescription ? isDescriptionVisible : undefined}
                    >
                        <div className="product-image-wrap">
                            <img src={activeImage} alt={product.name} className="product-image" />
                            <span className="product-badge">{product.badge}</span>
                            {showDescription && isOverlayDescription && isDescriptionVisible ? (
                                <div className="product-description-overlay">
                                    <strong>Descrição do produto</strong>
                                    <p>{product.description}</p>
                                </div>
                            ) : null}
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

                    {showDescription && !isOverlayDescription ? (
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

export function ProductGrid({ items, showDescription = true, descriptionMode = "panel" }) {
    if (!items.length) {
        return (
            <div className="empty-state">
                <h1>Nenhum produto encontrado</h1>
                <p>No momento não há itens disponíveis com esse filtro. Tente outra categoria ou fale com a equipe.</p>
                <div className="section-actions">
                    <a href="/contato" className="secondary-button">
                        Falar com a equipe
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="product-grid">
            {items.map((product) => (
                <ProductCard key={product.id} product={product} showDescription={showDescription} descriptionMode={descriptionMode} />
            ))}
        </div>
    );
}
