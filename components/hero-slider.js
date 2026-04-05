"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { heroSlides, store } from "../data/store";

export function HeroSlider() {
    const [activeIndex, setActiveIndex] = useState(0);
    const videoRefs = useRef([]);

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            setActiveIndex((currentIndex) => (currentIndex + 1) % heroSlides.length);
        }, 5000);

        return () => window.clearInterval(intervalId);
    }, []);

    useEffect(() => {
        videoRefs.current.forEach((videoEl, index) => {
            if (!videoEl) return;
            if (index === activeIndex) {
                videoEl.play().catch((err) => {
                    console.debug("[HeroSlider] autoplay blocked or failed for slide", index, slideSrc(videoEl), err);
                });
                console.debug("[HeroSlider] playing slide", index, slideSrc(videoEl));
            } else {
                videoEl.pause();
                console.debug("[HeroSlider] paused slide", index, slideSrc(videoEl));
            }
        });
    }, [activeIndex]);

    function slideSrc(videoEl) {
        return videoEl?.currentSrc || videoEl?.src || "";
    }

    function setVideoRef(index, el) {
        videoRefs.current[index] = el;
    }

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
                    key={slide.video}
                    className={`hero-slide ${index === activeIndex ? "is-active" : ""}`}
                >
                    <video
                        ref={(el) => setVideoRef(index, el)}
                        className="hero-slide-video"
                        src={slide.video}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        aria-hidden
                    />
                    <div className="hero-slide-overlay" aria-hidden />
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
                        key={slide.video}
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
