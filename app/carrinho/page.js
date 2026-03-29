import Link from "next/link";
import { Breadcrumb } from "../../components/breadcrumb";
import { store } from "../../data/store";

export const metadata = {
    title: "Carrinho | DeVille Fashion",
};

export default function CartPage() {
    return (
        <main className="page-shell">
            <Breadcrumb currentPage="Carrinho" />
            <section className="section narrow-section">
                <div className="empty-state">
                    <p className="section-kicker">Seu carrinho</p>
                    <h1>Seu carrinho está vazio no momento</h1>
                    <p>Explore o catálogo e fale com a equipe para reservar suas peças favoritas com atendimento personalizado.</p>
                    <div className="section-actions">
                        <Link href="/produtos" className="primary-button">
                            Ver produtos
                        </Link>
                        <a
                            href={`https://wa.me/${store.whatsapp}?text=Olá, quero montar meu pedido com a DeVille Fashion.`}
                            target="_blank"
                            rel="noreferrer"
                            className="secondary-button"
                        >
                            Montar pedido no WhatsApp
                        </a>
                    </div>
                </div>
            </section>
        </main>
    );
}
