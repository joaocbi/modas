import { AdminDashboard } from "../../components/admin-dashboard";
import { getAllProducts, getStorageMode, isAdminMutationEnabled } from "../../lib/product-store";
import { getAdminSession } from "../../lib/admin-session";

export const metadata = {
    title: "Admin | DeVille Fashion",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
    const session = await getAdminSession();
    const products = await getAllProducts();
    const storageMode = getStorageMode();
    const canManage = isAdminMutationEnabled();

    return (
        <AdminDashboard
            initialProducts={products}
            adminEmail={session?.email || "admin"}
            storageMode={storageMode}
            canManage={canManage}
        />
    );
}
