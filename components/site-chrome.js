"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./footer";
import { Header } from "./header";

export function SiteChrome({ children, whatsappHref }) {
    const pathname = usePathname();
    const isAdminRoute = pathname.startsWith("/admin");

    if (isAdminRoute) {
        return <>{children}</>;
    }

    return (
        <>
            <Header />
            {children}
            <Footer />
            <a href={whatsappHref} target="_blank" rel="noreferrer" className="whatsapp-float">
                WhatsApp
            </a>
        </>
    );
}
