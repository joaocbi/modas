import { AdminDashboard } from "../../components/admin-dashboard";
import { redirect } from "next/navigation";
import { getAllCoupons } from "../../lib/coupon-store";
import { getAllLeads } from "../../lib/lead-store";
import { getAllOrders } from "../../lib/order-store";
import { getAllProductCategories } from "../../lib/product-category-store";
import { getAllProducts, getStorageMode, isAdminMutationEnabled } from "../../lib/product-store";
import { canStoreProductImages } from "../../lib/product-image-store";
import { getAdminSession } from "../../lib/admin-session";

export const metadata = {
    title: "Admin | Do Santos Market",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
    const session = await getAdminSession();

    if (!session) {
        redirect("/admin/login");
    }

    const [products, orders, coupons, leads, productCategories] = await Promise.all([
        getAllProducts(),
        getAllOrders(),
        getAllCoupons(),
        getAllLeads(),
        getAllProductCategories(),
    ]);
    const storageMode = getStorageMode();
    const canManage = isAdminMutationEnabled();
    const canUploadProductImages = canStoreProductImages();

    return (
        <AdminDashboard
            initialProducts={products}
            initialOrders={orders}
            initialCoupons={coupons}
            initialLeads={leads}
            initialProductCategories={productCategories}
            adminEmail={session?.email || "admin"}
            storageMode={storageMode}
            canManage={canManage}
            canUploadProductImages={canUploadProductImages}
        />
    );
}
