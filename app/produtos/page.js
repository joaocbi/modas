import { Breadcrumb } from "../../components/breadcrumb";
import { ProductGrid } from "../../components/product-grid";
import { getAllProducts } from "../../lib/product-store";

export const metadata = {
    title: "Produtos | Do Santos Market",
};

export const revalidate = 300;

function normalizeCategoryParam(value) {
    return String(value || "").trim().toLocaleLowerCase("pt-BR");
}

export default async function ProductsPage({ searchParams }) {
    const resolvedSearchParams = await searchParams;
    const products = await getAllProducts({ forPublicStorefront: true });
    const selectedCategory = String(resolvedSearchParams?.categoria || "").trim();
    const filteredProducts = selectedCategory
        ? products.filter((product) => normalizeCategoryParam(product.category) === normalizeCategoryParam(selectedCategory))
        : products;

    return (
        <main className="page-shell">
            <Breadcrumb currentPage="Produtos" />
            <section className="section">
                <div className="section-heading align-center">
                    <p className="section-kicker">{selectedCategory ? "Categoria selecionada" : "Catálogo"}</p>
                    <h1>{selectedCategory ? selectedCategory : "Todos os produtos"}</h1>
                    <p>
                        {selectedCategory
                            ? "Confira os produtos dessa categoria e finalize o atendimento diretamente com a equipe pelo WhatsApp."
                            : "Escolha a peça ideal e finalize o atendimento diretamente com a equipe pelo WhatsApp."}
                    </p>
                </div>
                <ProductGrid items={filteredProducts} descriptionMode="overlay" />
            </section>
        </main>
    );
}
