document.addEventListener('DOMContentLoaded', () => {
    const products = [
        {
            id: 1,
            name: 'Conjunto Linho',
            description: 'Conjunto sofisticado em linho com caimento leve e acabamento premium.',
            category: 'Conjuntos',
            price: 116.66,
            oldPrice: 166.65,
            badge: '-30% OFF',
            image: 'assets/product_1.jpg',
            featured: true,
        },
        {
            id: 2,
            name: 'Macaquinho Cleane',
            description: 'Macaquinho moderno para looks versateis e elegantes.',
            category: 'Macaquinhos',
            price: 120.54,
            oldPrice: 172.20,
            badge: '-30% OFF',
            image: 'assets/product_2.jpg',
            featured: true,
        },
        {
            id: 3,
            name: 'Conjunto Evelly',
            description: 'Modelo feminino com visual contemporaneo para uso diario.',
            category: 'Conjuntos',
            price: 116.67,
            oldPrice: 166.67,
            badge: '-30% OFF',
            image: 'assets/product_3.jpg',
            featured: true,
        },
        {
            id: 4,
            name: 'Macaquinho Yasmin',
            description: 'Peca curinga para compor producoes leves e refinadas.',
            category: 'Macaquinhos',
            price: 110.18,
            oldPrice: 157.40,
            badge: '-30% OFF',
            image: 'assets/product_4.jpg',
            featured: true,
        },
        {
            id: 5,
            name: 'Vestido Aurora',
            description: 'Vestido com acabamento elegante e proposta premium para ocasioes especiais.',
            category: 'Vestidos',
            price: 189.90,
            oldPrice: 229.90,
            badge: 'NEW',
            image: 'assets/product_1.jpg',
            featured: false,
        },
    ];

    function formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(Number(value || 0));
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function buildProductCard(product) {
        const badge = product.badge ? `<span class="discount-badge">${escapeHtml(product.badge)}</span>` : '';
        const oldPrice = product.oldPrice ? `<span class="original-price">${formatCurrency(product.oldPrice)}</span>` : '';

        return `
            <article class="product-card" data-product-id="${product.id}">
                <div class="product-image">
                    <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">
                    ${badge}
                </div>
                <div class="product-info">
                    <h3 class="product-title">${escapeHtml(product.name).toUpperCase()}</h3>
                    <div class="product-price">
                        <span class="current-price">${formatCurrency(product.price)}</span>
                        ${oldPrice}
                    </div>
                </div>
            </article>
        `;
    }

    function renderHomeProducts() {
        const grid = document.querySelector('.product-section .product-grid');
        if (!grid) {
            return;
        }

        const featuredProducts = products.filter((product) => product.featured).slice(0, 4);
        grid.innerHTML = featuredProducts.map(buildProductCard).join('');
        console.log('[Storefront] Featured products rendered.', featuredProducts);
    }

    function renderProductsPage() {
        const pageTitle = document.querySelector('.account-page h2');
        const container = document.querySelector('.account-page .account-container');

        if (!pageTitle || !container) {
            return;
        }

        const normalizedTitle = pageTitle.textContent.trim().toUpperCase();
        if (normalizedTitle !== 'TODOS OS PRODUTOS') {
            return;
        }

        container.style.display = 'block';
        container.style.textAlign = 'initial';
        container.style.padding = '50px 20px';
        container.innerHTML = `
            <h2 style="text-align: center;">TODOS OS PRODUTOS</h2>
            <p style="text-align: center; margin: 18px 0 36px;">
                Confira os destaques atuais da colecao DeVille Fashion.
            </p>
            <div class="product-grid products-generated-grid">${products.map(buildProductCard).join('')}</div>
        `;
        console.log('[Storefront] Products page rendered.', products);
    }

    function setupSlider() {
        const slides = Array.from(document.querySelectorAll('.hero-slider .slide'));
        const nextButton = document.querySelector('.slider-btn.next');
        const prevButton = document.querySelector('.slider-btn.prev');

        if (slides.length === 0 || !nextButton || !prevButton) {
            return;
        }

        let currentSlideIndex = slides.findIndex((slide) => slide.classList.contains('active'));
        if (currentSlideIndex < 0) {
            currentSlideIndex = 0;
            slides[0].classList.add('active');
        }

        function showSlide(nextIndex) {
            slides[currentSlideIndex].classList.remove('active');
            currentSlideIndex = (nextIndex + slides.length) % slides.length;
            slides[currentSlideIndex].classList.add('active');
            console.log('[Hero] Slide changed.', { currentSlideIndex });
        }

        prevButton.addEventListener('click', () => showSlide(currentSlideIndex - 1));
        nextButton.addEventListener('click', () => showSlide(currentSlideIndex + 1));

        window.setInterval(() => {
            showSlide(currentSlideIndex + 1);
        }, 5000);
    }

    function setupSearchTrigger() {
        document.querySelectorAll('.search-icon').forEach((trigger) => {
            trigger.addEventListener('click', () => {
                console.log('[Search] Search trigger clicked.');
                window.alert('A busca ainda nao esta disponivel nesta versao publica.');
            });
        });
    }

    function setupStaticForms() {
        const forms = Array.from(document.querySelectorAll('form'));
        forms.forEach((form) => {
            form.addEventListener('submit', (event) => {
                event.preventDefault();

                const formData = new FormData(form);
                const payload = Object.fromEntries(formData.entries());
                console.log('[Form] Static form submission intercepted.', payload);

                window.alert('Recebemos sua solicitacao. Em uma integracao real, estes dados seriam enviados para o atendimento.');
                form.reset();
            });
        });
    }

    function syncCartCount() {
        const cartCountElements = document.querySelectorAll('.cart-count');
        const storedCount = Number.parseInt(window.localStorage.getItem('deville-cart-count') || '0', 10) || 0;

        cartCountElements.forEach((element) => {
            element.textContent = String(storedCount);
        });

        console.log('[Cart] Cart count synchronized.', { storedCount });
    }

    renderHomeProducts();
    renderProductsPage();
    setupSlider();
    setupSearchTrigger();
    setupStaticForms();
    syncCartCount();

    console.log('[App] Public storefront initialized successfully.');
});
