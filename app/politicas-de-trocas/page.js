import { Breadcrumb } from "../../components/breadcrumb";
import { exchangeSections, store } from "../../data/store";

export const metadata = {
    title: "Políticas de trocas | DeVille Fashion",
};

export default function ExchangePolicyPage() {
    return (
        <main className="page-shell">
            <Breadcrumb currentPage="Políticas de trocas" />
            <section className="section narrow-section">
                <div className="section-heading align-center">
                    <p className="section-kicker">Transparência e cuidado</p>
                    <h1>Políticas de trocas e devoluções</h1>
                    <p>Veja as principais regras para trocas por defeito, tamanho, preferência e solicitações de reembolso.</p>
                </div>

                <div className="content-list">
                    {exchangeSections.map((section) => (
                        <article key={section.title} className="content-card">
                            <h2>{section.title}</h2>
                            <p>{section.description}</p>
                            <ul className="styled-list">
                                {section.items.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </div>

                <section className="notice-card">
                    <h2>Como solicitar</h2>
                    <p>
                        Envie nome completo, número do pedido, motivo da solicitação e fotos quando necessário para o
                        WhatsApp <strong>{store.whatsapp}</strong> ou para o e-mail <strong>{store.email}</strong>.
                    </p>
                </section>
            </section>
        </main>
    );
}
