import { Breadcrumb } from "../../components/breadcrumb";
import { howToBuySteps } from "../../data/store";

export const metadata = {
    title: "Como comprar | Do Santos Market",
};

export default function HowToBuyPage() {
    return (
        <main className="page-shell">
            <Breadcrumb currentPage="Como comprar" />
            <section className="section narrow-section">
                <div className="section-heading align-center">
                    <p className="section-kicker">Jornada de compra</p>
                    <h1>Como comprar</h1>
                    <p>Uma experiência de compra leve, elegante e orientada por atendimento real em poucos passos.</p>
                </div>

                <div className="timeline">
                    {howToBuySteps.map((step, index) => (
                        <article key={step.title} className="timeline-item">
                            <span className="timeline-index">{String(index + 1).padStart(2, "0")}</span>
                            <div>
                                <h2>{step.title}</h2>
                                <p>{step.description}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </main>
    );
}
