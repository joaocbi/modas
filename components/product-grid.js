import { getProductWhatsAppLink } from "../data/store";

function formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
}

export function ProductGrid({ items, showDescription = true }) {
    return (
        <div className="product-grid">
            {items.map((product) => (
                <article key={product.id} className="product-card">
                    <div className="product-image-wrap">
                        <img src={product.image} alt={product.name} className="product-image" />
                        <span className="product-badge">{product.badge}</span>
                    </div>

                    <div className="product-body">
                        <p className="product-category">{product.category}</p>
                        {product.subcategory ? <p className="product-meta">{product.subcategory}</p> : null}
                        <h3>{product.name}</h3>
                        {showDescription ? <p className="product-description">{product.description}</p> : null}
                        <p className="product-meta">Tamanhos: {product.sizes.join(" • ")}</p>
                        <p className="product-meta">Cores: {product.colors.join(" • ")}</p>
                        {product.paymentMethods?.length ? (
                            <p className="product-meta">Pagamento: {product.paymentMethods.join(" • ")}</p>
                        ) : null}

                        <div className="product-prices">
                            <strong>{formatCurrency(product.price)}</strong>
                            <span>{formatCurrency(product.oldPrice)}</span>
                        </div>

                        <div className="product-actions">
                            <a href={getProductWhatsAppLink(product)} target="_blank" rel="noreferrer" className="primary-button">
                                Comprar no WhatsApp
                            </a>
                            {product.mercadoPagoEnabled && product.mercadoPagoLink ? (
                                <a href={product.mercadoPagoLink} target="_blank" rel="noreferrer" className="secondary-button">
                                    Pagar com Mercado Pago
                                </a>
                            ) : null}
                            <a href="/contato" className="text-button">
                                Tirar dúvidas
                            </a>
                        </div>
                    </div>
                </article>
            ))}
        </div>
    );
}
