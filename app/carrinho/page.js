import { Breadcrumb } from "../../components/breadcrumb";
import { CheckoutPageClient } from "../../components/checkout-page-client";
import { getAllProducts } from "../../lib/product-store";

export const metadata = {
    title: "Carrinho | Do Santos Market",
};

export const revalidate = 300;

export default async function CartPage({ searchParams }) {
    const resolvedSearchParams = await searchParams;
    const products = await getAllProducts({ forPublicStorefront: true });
    const buyNowProductId = Number(resolvedSearchParams?.buyNow || 0) || null;
    const buyNowSize = String(resolvedSearchParams?.size || "").trim();
    const buyNowColor = String(resolvedSearchParams?.color || "").trim();
    const buyNowStrapShoulder = String(resolvedSearchParams?.strap || "").trim();
    const buyNowFabricPattern = String(resolvedSearchParams?.fabric || "").trim();

    return (
        <main className="page-shell">
            <Breadcrumb currentPage="Carrinho" />
            <CheckoutPageClient
                initialProducts={products}
                buyNowProductId={buyNowProductId}
                buyNowSize={buyNowSize}
                buyNowColor={buyNowColor}
                buyNowStrapShoulder={buyNowStrapShoulder}
                buyNowFabricPattern={buyNowFabricPattern}
            />
        </main>
    );
}
