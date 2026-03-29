import { AdminDashboard } from "../../components/admin-dashboard";
import { getAllCoupons } from "../../lib/coupon-store";
import { getAllOrders } from "../../lib/order-store";
import { getAllProducts, getStorageMode, isAdminMutationEnabled } from "../../lib/product-store";
import { getAdminSession } from "../../lib/admin-session";

export const metadata = {
    title: "Admin | DeVille Fashion",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
    const session = await getAdminSession();
    const [products, orders, coupons] = await Promise.all([
        getAllProducts(),
        getAllOrders(),
        getAllCoupons(),
    ]);
    const storageMode = getStorageMode();
    const canManage = isAdminMutationEnabled();

    return (
        <AdminDashboard
            initialProducts={products}
            initialOrders={orders}
            initialCoupons={coupons}
            adminEmail={session?.email || "admin"}
            storageMode={storageMode}
            canManage={canManage}
        />
    );
}
