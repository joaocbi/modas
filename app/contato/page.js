import { Breadcrumb } from "../../components/breadcrumb";
import { ContactForm } from "../../components/contact-form";
import { store } from "../../data/store";

const contactFields = [
    { name: "name", label: "Nome completo", type: "text", placeholder: "Seu nome" },
    { name: "email", label: "E-mail", type: "email", placeholder: "Seu melhor e-mail" },
    { name: "phone", label: "Telefone ou WhatsApp", type: "text", placeholder: "(00) 00000-0000" },
    { name: "message", label: "Mensagem", type: "textarea", placeholder: "Escreva como podemos ajudar", fullWidth: true },
];

export const metadata = {
    title: "Contato | DeVille Fashion",
};

export default function ContactPage() {
    return (
        <main className="page-shell">
            <Breadcrumb currentPage="Contato" />
            <section className="section">
                <div className="two-column">
                    <div className="content-card">
                        <p className="section-kicker">Fale conosco</p>
                        <h1>Atendimento real por WhatsApp e e-mail</h1>
                        <p>
                            Nossa equipe está pronta para ajudar com pedidos, trocas, retirada, disponibilidade de tamanhos
                            e orientações de compra.
                        </p>
                        <div className="info-stack">
                            <div>
                                <strong>WhatsApp</strong>
                                <p>{store.whatsapp}</p>
                            </div>
                            <div>
                                <strong>E-mail</strong>
                                <p>{store.email}</p>
                            </div>
                            <div>
                                <strong>Horário de atendimento</strong>
                                <p>{store.supportHours.join(" • ")}</p>
                            </div>
                        </div>
                    </div>

                    <ContactForm
                        title="Envie sua mensagem"
                        description="Preencha os dados abaixo e escolha o canal para continuar seu atendimento."
                        subject="Contato pelo site DeVille Fashion"
                        fields={contactFields}
                    />
                </div>
            </section>
        </main>
    );
}
