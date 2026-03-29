import { Breadcrumb } from "../../components/breadcrumb";
import { ContactForm } from "../../components/contact-form";

const accessFields = [
    { name: "email", label: "E-mail", type: "email", placeholder: "Seu e-mail de acesso" },
    { name: "phone", label: "WhatsApp", type: "text", placeholder: "(00) 00000-0000" },
];

const registerFields = [
    { name: "name", label: "Nome completo", type: "text", placeholder: "Seu nome completo" },
    { name: "email", label: "E-mail", type: "email", placeholder: "Seu melhor e-mail" },
    { name: "cpf", label: "CPF", type: "text", placeholder: "000.000.000-00" },
    { name: "phone", label: "WhatsApp", type: "text", placeholder: "(00) 00000-0000" },
];

export const metadata = {
    title: "Minha conta | DeVille Fashion",
};

export default function LoginPage() {
    return (
        <main className="page-shell">
            <Breadcrumb currentPage="Minha conta" />
            <section className="section">
                <div className="section-heading align-center">
                    <p className="section-kicker">Conta e cadastro</p>
                    <h1>Atendimento assistido para acesso e cadastro</h1>
                    <p>
                        Nesta versão, o cadastro e o suporte de conta são feitos com atendimento real pelo canal que você preferir.
                    </p>
                </div>

                <div className="two-column">
                    <ContactForm
                        title="Já sou cliente"
                        description="Solicite apoio para acessar sua conta ou confirmar seus dados."
                        subject="Solicitação de acesso à conta"
                        fields={accessFields}
                    />
                    <ContactForm
                        title="Criar uma conta"
                        description="Envie seus dados para iniciar um cadastro assistido com nossa equipe."
                        subject="Solicitação de novo cadastro"
                        fields={registerFields}
                    />
                </div>
            </section>
        </main>
    );
}
