import { Montserrat, Playfair_Display } from "next/font/google";
import { SiteChrome } from "../components/site-chrome";
import { store } from "../data/store";
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
    title: "DeVille Fashion",
    description: "Moda feminina com curadoria elegante, atendimento próximo e compra facilitada por WhatsApp.",
    icons: {
        icon: "/icon.svg",
        shortcut: "/icon.svg",
        apple: "/apple-icon",
    },
    manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }) {
    const whatsappHref = `https://wa.me/${store.whatsapp}?text=Olá, quero atendimento da DeVille Fashion.`;

    return (
        <html lang="pt-BR">
            <body className={`${montserrat.className} ${playfairDisplay.variable}`}>
                <SiteChrome whatsappHref={whatsappHref}>{children}</SiteChrome>
            </body>
        </html>
    );
}
