import { Breadcrumb } from "../../components/breadcrumb";
import { pickupDetails } from "../../data/store";

export const metadata = {
    title: "Retirada | DeVille Fashion",
};

export default function PickupPage() {
    return (
        <main className="page-shell">
            <Breadcrumb currentPage="Retirada" />
            <section className="section narrow-section">
                <div className="section-heading align-center">
                    <p className="section-kicker">Retirada em loja</p>
                    <h1>Como funciona a retirada</h1>
                    <p>Organizamos o processo para que sua retirada seja rápida, segura e com atendimento personalizado.</p>
                </div>

                <div className="content-list">
                    {pickupDetails.map((detail) => (
                        <article key={detail.title} className="content-card">
                            <h2>{detail.title}</h2>
                            <ul className="styled-list">
                                {detail.items.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </div>
            </section>
        </main>
    );
}
