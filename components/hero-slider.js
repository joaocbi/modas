"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { heroSlides, store } from "../data/store";

export function HeroSlider() {
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            setActiveIndex((currentIndex) => (currentIndex + 1) % heroSlides.length);
        }, 5000);

        return () => window.clearInterval(intervalId);
    }, []);

    function goToSlide(step) {
        setActiveIndex((currentIndex) => (currentIndex + step + heroSlides.length) % heroSlides.length);
    }

    function goToSlideIndex(nextIndex) {
        setActiveIndex(nextIndex);
    }

    return (
        <section className="hero-section">
            {heroSlides.map((slide, index) => (
                <div
                    key={slide.image}
                    className={`hero-slide ${index === activeIndex ? "is-active" : ""}`}
                    style={{
                        backgroundImage: `linear-gradient(90deg, rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.15)), url(${slide.image})`,
                        backgroundSize: "100% 100%, contain",
                        backgroundPosition: "center, right center",
                        backgroundRepeat: "no-repeat, no-repeat",
                        backgroundColor: "#1f1a16",
                    }}
                >
                    <div className="hero-content">
                        <p className="section-kicker">{slide.eyebrow}</p>
                        <h1>{slide.title}</h1>
                        <p>{slide.description}</p>
                        <div className="hero-actions">
                            <Link href="/produtos" className="primary-button">
                                Ver produtos
                            </Link>
                            <a
                                href={`https://wa.me/${store.whatsapp}?text=Olá, quero atendimento com consultor da DeVille Fashion.`}
                                target="_blank"
                                rel="noreferrer"
                                className="secondary-button"
                            >
                                Falar no WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
            ))}

            <button type="button" className="slider-button slider-button-left" onClick={() => goToSlide(-1)} aria-label="Slide anterior">
                <ChevronLeft size={20} />
            </button>
            <button type="button" className="slider-button slider-button-right" onClick={() => goToSlide(1)} aria-label="Próximo slide">
                <ChevronRight size={20} />
            </button>

            <div className="hero-dots" aria-label="Indicadores do slider">
                {heroSlides.map((slide, index) => (
                    <button
                        key={slide.image}
                        type="button"
                        className={`hero-dot ${index === activeIndex ? "is-active" : ""}`}
                        onClick={() => goToSlideIndex(index)}
                        aria-label={`Ir para o slide ${index + 1}`}
                    />
                ))}
            </div>
        </section>
    );
}
