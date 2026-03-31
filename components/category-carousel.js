"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const SCROLL_OFFSET = 320;
const AUTO_SCROLL_INTERVAL_MS = 3500;

export function CategoryCarousel({ items }) {
    const trackRef = useRef(null);
    const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);

    if (!items.length) {
        return null;
    }

    useEffect(() => {
        if (isAutoScrollPaused || items.length <= 1) {
            return undefined;
        }

        const intervalId = window.setInterval(() => {
            const track = trackRef.current;

            if (!track) {
                return;
            }

            const reachedEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;

            track.scrollTo({
                left: reachedEnd ? 0 : track.scrollLeft + SCROLL_OFFSET,
                behavior: "smooth",
            });
        }, AUTO_SCROLL_INTERVAL_MS);

        return () => window.clearInterval(intervalId);
    }, [isAutoScrollPaused, items.length]);

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

            <div
                ref={trackRef}
                className="category-carousel-track"
                onMouseEnter={() => setIsAutoScrollPaused(true)}
                onMouseLeave={() => setIsAutoScrollPaused(false)}
                onFocus={() => setIsAutoScrollPaused(true)}
                onBlur={() => setIsAutoScrollPaused(false)}
            >
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
