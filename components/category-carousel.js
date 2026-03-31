"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

const SCROLL_OFFSET = 320;

export function CategoryCarousel({ items }) {
    const trackRef = useRef(null);

    if (!items.length) {
        return null;
    }

    function scrollTrack(direction) {
        trackRef.current?.scrollBy({
            left: direction * SCROLL_OFFSET,
            behavior: "smooth",
        });
    }

    return (
        <section className="category-carousel-shell" aria-label="Categorias em destaque">
            <div className="category-carousel-header">
                <div>
                    <p className="section-kicker">Categorias</p>
                    <h2>Compre por categoria</h2>
                </div>
                <div className="category-carousel-controls">
                    <button type="button" className="icon-button" onClick={() => scrollTrack(-1)} aria-label="Categorias anteriores">
                        <ChevronLeft size={18} />
                    </button>
                    <button type="button" className="icon-button" onClick={() => scrollTrack(1)} aria-label="Próximas categorias">
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            <div ref={trackRef} className="category-carousel-track">
                {items.map((category) => (
                    <Link
                        key={category.id}
                        href={`/produtos?categoria=${encodeURIComponent(category.name)}`}
                        className="category-carousel-card"
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
        </section>
    );
}
