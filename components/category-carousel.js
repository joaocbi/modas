"use client";

import Link from "next/link";

export function CategoryCarousel({ items }) {
    if (!items.length) {
        return null;
    }

    const repeatedItems = [...items, ...items];
    const animationDuration = `${Math.max(18, items.length * 6)}s`;

    return (
        <section className="category-carousel-shell" aria-label="Categorias em destaque">
            <div className="category-carousel-header">
                <div>
                    <p className="section-kicker">Categorias</p>
                    <h2>Compre por categoria</h2>
                </div>
            </div>

            <div className="category-carousel-viewport">
                <div className="category-carousel-track" style={{ "--category-carousel-duration": animationDuration }}>
                    {repeatedItems.map((category, index) => (
                        <Link
                            key={`${category.id}-${index}`}
                            href={`/produtos?categoria=${encodeURIComponent(category.name)}`}
                            className="category-carousel-card"
                            aria-hidden={index >= items.length ? "true" : undefined}
                            tabIndex={index >= items.length ? -1 : undefined}
                        >
                            <div className="category-carousel-image-wrap">
                                <img src={category.image} alt={category.name} className="category-carousel-image" />
                            </div>
                            <div className="category-carousel-copy">
                                <strong>{category.name}</strong>
                                <span>{category.subcategories?.length ? `${category.subcategories.length} subcategoria(s)` : "Ver produtos"}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
