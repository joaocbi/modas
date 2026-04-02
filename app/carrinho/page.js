import { Breadcrumb } from "../../components/breadcrumb";
import { CheckoutPageClient } from "../../components/checkout-page-client";
import { getAllProducts } from "../../lib/product-store";

export const metadata = {
    title: "Carrinho | DeVille Fashion",
};

export const revalidate = 300;

export default async function CartPage({ searchParams }) {
    const resolvedSearchParams = await searchParams;
    const products = await getAllProducts();
    const buyNowProductId = Number(resolvedSearchParams?.buyNow || 0) || null;
    const buyNowSize = String(resolvedSearchParams?.size || "").trim();
    const buyNowColor = String(resolvedSearchParams?.color || "").trim();

    return (
        <main className="page-shell">
            <Breadcrumb currentPage="Carrinho" />
            <CheckoutPageClient
                initialProducts={products}
                buyNowProductId={buyNowProductId}
                buyNowSize={buyNowSize}
                buyNowColor={buyNowColor}
            />
        </main>
    );
}
