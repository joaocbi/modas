"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getProductWhatsAppLink } from "../data/store";
import { addCartItem } from "../lib/cart";

function formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
}

function getProductImages(product) {
    const images = Array.isArray(product.images) && product.images.length ? product.images : [product.image].filter(Boolean);
    return images.slice(0, 20);
}

function ProductCard({ product, showDescription, descriptionMode }) {
    const images = getProductImages(product);
    const [activeImage, setActiveImage] = useState(images[0]);
    const [isDescriptionVisible, setIsDescriptionVisible] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [zoomOrigin, setZoomOrigin] = useState("50% 50%");
    const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || "");
    const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || "");
    const strapShoulderOptions = Array.isArray(product.strapShoulderOptions) ? product.strapShoulderOptions : [];
    const fabricPatternOptions = Array.isArray(product.fabricPatternOptions) ? product.fabricPatternOptions : [];
    const [selectedStrapShoulder, setSelectedStrapShoulder] = useState("");
    const [selectedFabricPattern, setSelectedFabricPattern] = useState("");
    const [cartFeedback, setCartFeedback] = useState("");
    const cardRef = useRef(null);
    const expandedPreviewRef = useRef(null);
    const isOverlayDescription = descriptionMode === "overlay";

    useEffect(() => {
        setSelectedSize(product.sizes?.[0] || "");
        setSelectedColor(product.colors?.[0] || "");
        setSelectedStrapShoulder(strapShoulderOptions[0] || "");
        setSelectedFabricPattern(fabricPatternOptions[0] || "");
        setCartFeedback("");
    }, [fabricPatternOptions, product.colors, product.id, product.sizes, strapShoulderOptions]);

    useEffect(() => {
        if (!isOverlayDescription || !isDescriptionVisible) {
            return undefined;
        }

        function handlePointerDown(event) {
            // Expanded preview is rendered outside the card; clicks there must not count as "outside".
            if (cardRef.current?.contains(event.target) || expandedPreviewRef.current?.contains(event.target)) {
                return;
            }

            setIsDescriptionVisible(false);
            console.log("[ProductGrid] Product description closed by outside click.", {
                productId: product.id,
                productName: product.name,
            });
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
            setIsDescriptionVisible(true);
            console.log("[ProductGrid] Product description opened from main image.", {
                productId: product.id,
                productName: product.name,
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

    function handleCardBlur(event) {
        if (!isOverlayDescription || event.currentTarget.contains(event.relatedTarget)) {
            return;
        }

        // Do not close overlay mode when focus moves into the expanded preview (outside the card DOM).
        // Overlay preview is closed via backdrop or outside-click handler, not card blur.
        if (isDescriptionVisible) {
            return;
        }

        setIsDescriptionVisible(false);
        console.log("[ProductGrid] Product description hidden by focus out.", {
            productId: product.id,
            productName: product.name,
        });
    }

    function handleAddToCart() {
        addCartItem({
            productId: product.id,
            quantity: 1,
            selectedSize,
            selectedColor,
            selectedStrapShoulder,
            selectedFabricPattern,
        });
        setCartFeedback("Adicionado ao carrinho");
        console.log("[ProductGrid] Product added to cart.", {
            productId: product.id,
            selectedSize,
            selectedColor,
            selectedStrapShoulder,
            selectedFabricPattern,
        });
    }

    return (
        <>
            <article ref={cardRef} className="product-card" onBlur={handleCardBlur}>
                <div className="product-gallery">
                    <div className="product-gallery-stage">
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
                            </div>
                        </button>
                    </div>

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

                    <div className="product-option-grid">
                        <label className="product-option-field">
                            <span>Tamanho</span>
                            <select value={selectedSize} onChange={(event) => setSelectedSize(event.target.value)}>
                                {product.sizes.map((size) => (
                                    <option key={`${product.id}-size-${size}`} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="product-option-field">
                            <span>Cor</span>
                            <select value={selectedColor} onChange={(event) => setSelectedColor(event.target.value)}>
                                {product.colors.map((color) => (
                                    <option key={`${product.id}-color-${color}`} value={color}>
                                        {color}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="product-option-field">
                            <span>Cor da Correia/Ombro</span>
                            {strapShoulderOptions.length ? (
                                <select value={selectedStrapShoulder} onChange={(event) => setSelectedStrapShoulder(event.target.value)}>
                                    {strapShoulderOptions.map((option) => (
                                        <option key={`${product.id}-strap-${option}`} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    value={selectedStrapShoulder}
                                    onChange={(event) => setSelectedStrapShoulder(event.target.value)}
                                    placeholder="Ex.: Dourada"
                                    maxLength={120}
                                />
                            )}
                        </label>

                        <label className="product-option-field">
                            <span>Desenho do Tecido</span>
                            {fabricPatternOptions.length ? (
                                <select value={selectedFabricPattern} onChange={(event) => setSelectedFabricPattern(event.target.value)}>
                                    {fabricPatternOptions.map((option) => (
                                        <option key={`${product.id}-fabric-${option}`} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    value={selectedFabricPattern}
                                    onChange={(event) => setSelectedFabricPattern(event.target.value)}
                                    placeholder="Ex.: Liso / Estampado"
                                    maxLength={120}
                                />
                            )}
                        </label>
                    </div>

                    <div className="product-actions">
                        <button type="button" className="primary-button" onClick={handleAddToCart}>
                            Adicionar ao carrinho
                        </button>
                        <Link
                            href={`/carrinho?buyNow=${product.id}&size=${encodeURIComponent(selectedSize)}&color=${encodeURIComponent(selectedColor)}&strap=${encodeURIComponent(selectedStrapShoulder)}&fabric=${encodeURIComponent(selectedFabricPattern)}`}
                            className="secondary-button"
                        >
                            Comprar agora
                        </Link>
                        <a href="/contato" className="text-button">
                            Tirar duvidas
                        </a>
                        <a
                            href={getProductWhatsAppLink(product, {
                                selectedSize,
                                selectedColor,
                                selectedStrapShoulder,
                                selectedFabricPattern,
                            })}
                            target="_blank"
                            rel="noreferrer"
                            className="text-button"
                        >
                            WhatsApp
                        </a>
                    </div>
                    {cartFeedback ? <p className="product-feedback">{cartFeedback}</p> : null}
                </div>
            </article>

            {showDescription && isOverlayDescription && isDescriptionVisible ? (
                <div
                    ref={expandedPreviewRef}
                    className="product-expanded-preview-backdrop"
                    role="presentation"
                    onClick={() => setIsDescriptionVisible(false)}
                >
                    <div
                        className="product-expanded-preview-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-label={`Prévia ampliada de ${product.name}`}
                        onClick={(event) => event.stopPropagation()}
                        onPointerDown={(event) => event.stopPropagation()}
                    >
                        <div className="product-expanded-image-wrap">
                            <img src={activeImage} alt={`Prévia ampliada de ${product.name}`} className="product-expanded-image" />
                        </div>
                        <aside className="product-description-side-card is-visible">
                            <strong>Descrição do produto</strong>
                            <p>{product.description}</p>
                        </aside>
                    </div>
                </div>
            ) : null}

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
