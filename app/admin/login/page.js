import { redirect } from "next/navigation";
import { AdminLoginForm } from "../../../components/admin-login-form";
import { getAdminSession, isAdminConfigured } from "../../../lib/admin-session";

export const metadata = {
    title: "Admin Login | Do Santos Market",
};

export default async function AdminLoginPage() {
    const session = await getAdminSession();

    if (session) {
        redirect("/admin");
    }

    return <AdminLoginForm isConfigured={isAdminConfigured()} />;
}
