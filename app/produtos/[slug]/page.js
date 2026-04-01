import { notFound } from "next/navigation";
import { Breadcrumb } from "../../../components/breadcrumb";
import { ProductDetailView } from "../../../components/product-detail-view";
import { getProductBySlug, getProductVariations } from "../../../lib/product-store";

export const revalidate = 300;

export async function generateMetadata({ params }) {
    const resolvedParams = await params;
    const product = await getProductBySlug(resolvedParams?.slug);

    if (!product) {
        return {
            title: "Produto | DeVille Fashion",
        };
    }

    return {
        title: `${product.name} | DeVille Fashion`,
        description: product.description,
    };
}

export default async function ProductDetailPage({ params }) {
    const resolvedParams = await params;
    const product = await getProductBySlug(resolvedParams?.slug);

    if (!product) {
        notFound();
    }

    const variations = await getProductVariations(product);

    return (
        <main className="page-shell">
            <Breadcrumb currentPage={product.name} />
            <section className="section">
                <ProductDetailView product={product} variations={variations} />
            </section>
        </main>
    );
}
