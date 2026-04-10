import Link from "next/link";
import { Mail, WalletCards } from "lucide-react";
import { navigation, store } from "../data/store";

export function Footer() {
    return (
        <footer className="site-footer">
            <div className="footer-grid">
                <div>
                    <p className="footer-eyebrow">Departamentos</p>
                    <div className="footer-links">
                        {navigation.slice(0, 5).map((item) => (
                            <Link key={item.href} href={item.href}>
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>

                <div>
                    <p className="footer-eyebrow">Entre em contato</p>
                    <div className="footer-stack">
                        <a href={`https://wa.me/${store.whatsapp}`} target="_blank" rel="noreferrer">
                            <WalletCards size={16} />
                            {store.whatsapp}
                        </a>
                        <a href={`mailto:${store.email}`}>
                            <Mail size={16} />
                            {store.email}
                        </a>
                        <span>Atendimento personalizado</span>
                    </div>
                </div>

            </div>

            <div className="footer-bottom">
                <p>© 2026 Do Santos Market. Todos os direitos reservados.</p>
            </div>
        </footer>
    );
}
