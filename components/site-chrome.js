"use client";

import { usePathname } from "next/navigation";
import { CategoryCarousel } from "./category-carousel";
import { Footer } from "./footer";
import { Header } from "./header";

export function SiteChrome({ children, whatsappHref, initialCategoryCarouselItems = [] }) {
    const pathname = usePathname();
    const isAdminRoute = pathname.startsWith("/admin");

    if (isAdminRoute) {
        return <>{children}</>;
    }

    return (
        <>
            <Header />
            <CategoryCarousel items={initialCategoryCarouselItems} />
            {children}
            <Footer />
            <a href={whatsappHref} target="_blank" rel="noreferrer" className="whatsapp-float">
                WhatsApp
            </a>
        </>
    );
}
