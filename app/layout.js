import { Montserrat } from "next/font/google";
import { Footer } from "../components/footer";
import { Header } from "../components/header";
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
    return (
        <html lang="pt-BR">
            <body className={montserrat.className}>
                <Header />
                {children}
                <Footer />
                <a
                    href={`https://wa.me/${store.whatsapp}?text=Olá, quero atendimento da DeVille Fashion.`}
                    target="_blank"
                    rel="noreferrer"
                    className="whatsapp-float"
                >
                    WhatsApp
                </a>
            </body>
        </html>
    );
}
