"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { heroSlides, store } from "../data/store";

export function HeroSlider() {
    const [activeIndex, setActiveIndex] = useState(0);
    const videoRef = useRef(null);
    const activeSlide = heroSlides[activeIndex];

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            setActiveIndex((currentIndex) => (currentIndex + 1) % heroSlides.length);
        }, 5000);

        return () => window.clearInterval(intervalId);
    }, []);

    // Single video instance: iOS Safari often fails to decode/play when multiple <video> nodes exist (inactive slides at opacity 0).
    useEffect(() => {
        const videoEl = videoRef.current;
        if (!videoEl) {
            console.debug("[HeroSlider] no video ref yet for slide", activeIndex);
            return undefined;
        }

        videoEl.muted = true;
        videoEl.defaultMuted = true;
        videoEl.setAttribute("playsinline", "");
        videoEl.setAttribute("webkit-playsinline", "");

        function tryPlay() {
            const playResult = videoEl.play();
            if (playResult && typeof playResult.then === "function") {
                playResult.catch((err) => {
                    console.debug("[HeroSlider] play() rejected", { activeIndex, src: videoEl.currentSrc || videoEl.src, err });
                });
            }
        }

        if (videoEl.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            tryPlay();
        } else {
            videoEl.addEventListener("canplay", tryPlay, { once: true });
        }

        return () => {
            videoEl.removeEventListener("canplay", tryPlay);
        };
    }, [activeIndex]);

    return (
        <section className="hero-section">
            <div className="hero-slide is-active">
                <video
                    key={activeSlide.video}
                    ref={videoRef}
                    className="hero-slide-video"
                    src={activeSlide.video}
                    muted
                    defaultMuted
                    loop
                    playsInline
                    autoPlay
                    preload="auto"
                    controls={false}
                    disablePictureInPicture
                    aria-hidden
                />
                <div className="hero-slide-overlay" aria-hidden />
                <div className="hero-content">
                    <p className="section-kicker">{activeSlide.eyebrow}</p>
                    <h1>{activeSlide.title}</h1>
                    <p>{activeSlide.description}</p>
                    <div className="hero-actions">
                        <Link href="/produtos" className="primary-button">
                            Ver produtos
                        </Link>
                        <a
                            href={`https://wa.me/${store.whatsapp}?text=Olá, quero atendimento com consultor da Do Santos Market.`}
                            target="_blank"
                            rel="noreferrer"
                            className="secondary-button"
                        >
                            Falar no WhatsApp
                        </a>
                    </div>
                </div>
            </div>

            <button type="button" className="slider-button slider-button-left" onClick={() => setActiveIndex((i) => (i - 1 + heroSlides.length) % heroSlides.length)} aria-label="Slide anterior">
                <ChevronLeft size={20} />
            </button>
            <button type="button" className="slider-button slider-button-right" onClick={() => setActiveIndex((i) => (i + 1) % heroSlides.length)} aria-label="Próximo slide">
                <ChevronRight size={20} />
            </button>

            <div className="hero-dots" aria-label="Indicadores do slider">
                {heroSlides.map((slide, index) => (
                    <button
                        key={slide.video}
                        type="button"
                        className={`hero-dot ${index === activeIndex ? "is-active" : ""}`}
                        onClick={() => setActiveIndex(index)}
                        aria-label={`Ir para o slide ${index + 1}`}
                    />
                ))}
            </div>
        </section>
    );
}
