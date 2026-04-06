import { Breadcrumb } from "../../components/breadcrumb";
import { FaqList } from "../../components/faq-list";
import { faqItems } from "../../data/store";

export const metadata = {
    title: "Perguntas frequentes | Do Santos Market",
};

export default function FaqPage() {
    return (
        <main className="page-shell">
            <Breadcrumb currentPage="Perguntas frequentes" />
            <section className="section narrow-section">
                <div className="section-heading align-center">
                    <p className="section-kicker">Dúvidas comuns</p>
                    <h1>Perguntas frequentes</h1>
                    <p>Respondemos aqui as dúvidas mais comuns para acelerar seu atendimento e facilitar sua compra.</p>
                </div>
                <FaqList items={faqItems} />
            </section>
        </main>
    );
}
