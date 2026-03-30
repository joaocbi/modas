import { AdminDashboard } from "../../components/admin-dashboard";
import { redirect } from "next/navigation";
import { getAllCoupons } from "../../lib/coupon-store";
import { getAllLeads } from "../../lib/lead-store";
import { getAllOrders } from "../../lib/order-store";
import { getAllProducts, getStorageMode, isAdminMutationEnabled } from "../../lib/product-store";
import { getAdminSession } from "../../lib/admin-session";

export const metadata = {
    title: "Admin | DeVille Fashion",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
    const session = await getAdminSession();

    if (!session) {
        redirect("/admin/login");
    }

    const [products, orders, coupons, leads] = await Promise.all([
        getAllProducts(),
        getAllOrders(),
        getAllCoupons(),
        getAllLeads(),
    ]);
    const storageMode = getStorageMode();
    const canManage = isAdminMutationEnabled();

    return (
        <AdminDashboard
            initialProducts={products}
            initialOrders={orders}
            initialCoupons={coupons}
            initialLeads={leads}
            adminEmail={session?.email || "admin"}
            storageMode={storageMode}
            canManage={canManage}
        />
    );
}
