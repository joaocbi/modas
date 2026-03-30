import { Montserrat } from "next/font/google";
import { SiteChrome } from "../components/site-chrome";
import { store } from "../data/store";
import "./globals.css";

const montserrat = Montserrat({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});

export const metadata = {
    title: "DeVille Fashion",
    description: "Moda feminina com curadoria elegante, atendimento próximo e compra facilitada por WhatsApp.",
};

export default function RootLayout({ children }) {
    const whatsappHref = `https://wa.me/${store.whatsapp}?text=Olá, quero atendimento da DeVille Fashion.`;

    return (
        <html lang="pt-BR">
            <body className={montserrat.className}>
                <SiteChrome whatsappHref={whatsappHref}>{children}</SiteChrome>
            </body>
        </html>
    );
}
