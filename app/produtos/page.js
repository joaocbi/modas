import { Breadcrumb } from "../../components/breadcrumb";
import { ProductGrid } from "../../components/product-grid";
import { getAllProducts } from "../../lib/product-store";

export const metadata = {
    title: "Produtos | DeVille Fashion",
};

export const revalidate = 300;

export default async function ProductsPage() {
    const products = await getAllProducts();

    return (
        <main className="page-shell">
            <Breadcrumb currentPage="Produtos" />
            <section className="section">
                <div className="section-heading align-center">
                    <p className="section-kicker">Catálogo</p>
                    <h1>Todos os produtos</h1>
                    <p>Escolha a peça ideal e finalize o atendimento diretamente com a equipe pelo WhatsApp.</p>
                </div>
                <ProductGrid items={products} />
            </section>
        </main>
    );
}
