"use client";

import Link from "next/link";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { navigation } from "../data/store";
import { countCartItems, getCartItems, subscribeToCart } from "../lib/cart";

function isActive(pathname, href) {
    if (href === "/") {
        return pathname === "/";
    }

    return pathname.startsWith(href);
}

export function Header() {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        function syncCartCount(items) {
            setCartCount(countCartItems(items));
        }

        syncCartCount(getCartItems());
        return subscribeToCart(syncCartCount);
    }, []);

    return (
        <header className="site-header">
            <div className="header-top">
                <button
                    type="button"
                    className="icon-button mobile-only"
                    onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
                    aria-label="Abrir menu"
                >
                    {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>

                <button
                    type="button"
                    className="icon-button desktop-only"
                    onClick={() => window.alert("Use a página de produtos ou fale conosco no WhatsApp para localizar a peça ideal.")}
                    aria-label="Buscar"
                >
                    <Search size={18} />
                </button>

                <Link href="/" className="brand">
                    <span className="brand-mark">D</span>
                    <span className="brand-copy">
                        <span className="brand-name">DeVille Fashion</span>
                        <span className="brand-subtitle">MODAS E ACESSORIOS</span>
                    </span>
                </Link>

                <div className="header-actions">
                    <Link href="/login" className="icon-button" aria-label="Minha conta">
                        <User size={18} />
                    </Link>
                    <Link href="/carrinho" className="icon-button cart-button" aria-label="Carrinho">
                        <ShoppingBag size={18} />
                        <span className="cart-badge">{cartCount}</span>
                    </Link>
                </div>
            </div>

            <nav className={`main-nav ${isMenuOpen ? "is-open" : ""}`}>
                {navigation.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`nav-link ${isActive(pathname, item.href) ? "is-active" : ""}`}
                        onClick={() => setIsMenuOpen(false)}
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>
        </header>
    );
}
