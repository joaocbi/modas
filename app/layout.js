import { Montserrat, Playfair_Display } from "next/font/google";
import { SiteChrome } from "../components/site-chrome";
import { store } from "../data/store";
import { getAllProductCategories } from "../lib/product-category-store";
import "./globals.css";

const montserrat = Montserrat({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});

const playfairDisplay = Playfair_Display({
    subsets: ["latin"],
    weight: ["600", "700"],
    variable: "--font-brand",
});

export const metadata = {
    title: "Do Santos Market",
    description: "Moda feminina com curadoria elegante, atendimento próximo e compra facilitada por WhatsApp.",
    icons: {
        icon: "/icon.svg",
        shortcut: "/icon.svg",
        apple: "/apple-icon",
    },
    manifest: "/manifest.webmanifest",
};

export default async function RootLayout({ children }) {
    const whatsappHref = `https://wa.me/${store.whatsapp}?text=Olá, quero atendimento da Do Santos Market.`;
    const productCategories = await getAllProductCategories();

    return (
        <html lang="pt-BR">
            <body className={`${montserrat.className} ${playfairDisplay.variable}`}>
                {/* Sync splash for installed PWA: blocks first paint of page text (e.g. "Para...") before React hydrates. */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `(function(){try{var s=window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches;var i=window.navigator&&window.navigator.standalone===true;if(!s&&!i)return;document.documentElement.classList.add("pwa-splash-active");window.setTimeout(function(){document.documentElement.classList.remove("pwa-splash-active");},2000);}catch(e){}})();`,
                    }}
                />
                <div className="pwa-boot-cover" aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/assets/logo-do-santos-market.png" alt="" width={180} height={180} className="pwa-boot-cover-logo" />
                </div>
                <SiteChrome
                    whatsappHref={whatsappHref}
                    initialCategoryCarouselItems={productCategories.filter((category) => String(category.image || "").trim())}
                >
                    {children}
                </SiteChrome>
            </body>
        </html>
    );
}
