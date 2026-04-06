import Link from "next/link";
import { ContactForm } from "../components/contact-form";
import { HeroSlider } from "../components/hero-slider";
import { benefits, contactHighlights, promotions } from "../data/store";

const newsletterFields = [
    { name: "name", label: "Seu nome", type: "text", placeholder: "Como podemos te chamar?" },
    { name: "email", label: "Seu e-mail", type: "email", placeholder: "Digite seu melhor e-mail" },
];

export const revalidate = 300;

export default async function HomePage() {
    return (
        <main>
            <section className="benefits-bar">
                {benefits.map((benefit) => (
                    <article key={benefit.title} className="benefit-item">
                        <strong>{benefit.title}</strong>
                        <span>{benefit.description}</span>
                    </article>
                ))}
            </section>

            <HeroSlider />

            <section className="section">
                <div className="section-heading align-center">
                    <p className="section-kicker">Destaques da marca</p>
                    <h2>Seleção pensada para valorizar o seu estilo</h2>
                    <p>Campanhas visuais para direcionar a cliente às coleções e novidades da estação.</p>
                </div>
                <div className="promo-grid">
                    {promotions.map((promotion) => (
                        <article key={promotion.title} className="promo-card">
                            <img src={promotion.image} alt={promotion.title} />
                            <div className="promo-overlay">
                                <h3>{promotion.title}</h3>
                                <p>{promotion.subtitle}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <section className="section section-alt">
                <div className="two-column two-column-equal">
                    <div className="content-card">
                        <p className="section-kicker">Atendimento Vip</p>
                        <h2>Dúvidas? Fale com a nossa equipe</h2>
                        <div className="highlight-list">
                            {contactHighlights.map((item) => (
                                <div key={item} className="highlight-item">
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    <ContactForm
                        compact
                        title="Assine nossa newsletter"
                        description="Receba novidades e promoções em primeira mão pelo canal que preferir."
                        subject="Interesse em receber novidades da Do Santos Market"
                        fields={newsletterFields}
                    />
                </div>
            </section>
        </main>
    );
}
