document.addEventListener('DOMContentLoaded', () => {
    
    // Header Sticky Effect (though CSS sticky handles most of it, we can add a shadow class on scroll)
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 10) {
            header.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        } else {
            header.style.boxShadow = 'none';
        }
    });

    // Hero Slider Functionality
    const slides = document.querySelectorAll('.slide');
    const prevBtn = document.querySelector('.prev');
    const nextBtn = document.querySelector('.next');
    let currentSlide = 0;
    const slideInterval = 5000; // 5 seconds
    let slideTimer;

    function nextSlide() {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }

    function prevSlideAction() {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
    }

    function resetTimer() {
        clearInterval(slideTimer);
        slideTimer = setInterval(nextSlide, slideInterval);
    }

    if (slides.length > 0) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            resetTimer();
        });

        prevBtn.addEventListener('click', () => {
             prevSlideAction();
             resetTimer();
        });

        // Start automatic sliding
        slideTimer = setInterval(nextSlide, slideInterval);
    }

    // Newsletter Form Submission Prevent Default
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = newsletterForm.querySelector('input');
            if (input.value) {
                console.log('[Newsletter] Subscription requested for:', input.value);
                alert('Obrigado por se inscrever! Enviaremos as novidades para ' + input.value);
                input.value = '';
            }
        });
    }

    // Contact form visual feedback
    const contactForm = document.querySelector('#contact-name')?.closest('form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = contactForm.querySelector('#contact-name')?.value?.trim();
            const email = contactForm.querySelector('#contact-email')?.value?.trim();
            const phone = contactForm.querySelector('#contact-tel')?.value?.trim();
            const message = contactForm.querySelector('#contact-msg')?.value?.trim();

            console.log('[Contact] Form submission requested', { name, email, phone, messageLength: message?.length || 0 });

            if (!name || !email || !message) {
                alert('Preencha nome, e-mail e mensagem para continuar.');
                return;
            }

            alert('Mensagem recebida! Nossa equipe retornará em breve para ' + email + '.');
            contactForm.reset();
        });
    }

    // Login form visual feedback
    const loginForm = document.querySelector('#login-email')?.closest('form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const email = loginForm.querySelector('#login-email')?.value?.trim();
            console.log('[Login] Login requested for:', email);

            if (!email) {
                alert('Informe seu e-mail para entrar.');
                return;
            }

            alert('Login de demonstração enviado para ' + email + '. Integração completa em breve.');
        });
    }

    // Register form visual feedback
    const registerForm = document.querySelector('#reg-name')?.closest('form');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = registerForm.querySelector('#reg-name')?.value?.trim();
            const email = registerForm.querySelector('#reg-email')?.value?.trim();
            const cpf = registerForm.querySelector('#reg-cpf')?.value?.trim();

            console.log('[Register] Account creation requested', { name, email, cpf });

            if (!name || !email || !cpf) {
                alert('Preencha nome, e-mail e CPF para criar sua conta.');
                return;
            }

            alert('Cadastro de demonstração recebido para ' + email + '. Finalizaremos essa etapa em breve.');
            registerForm.reset();
        });
    }

    // Search icon temporary feedback
    const searchTriggers = document.querySelectorAll('.search-icon');
    searchTriggers.forEach((trigger) => {
        trigger.addEventListener('click', () => {
            console.log('[Search] Search requested from header icon');
            alert('A busca estará disponível em breve.');
        });
    });

    // Temporary support links
    const forgotPasswordLink = document.querySelector('.forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('[Auth] Password recovery requested');
            alert('A recuperação de senha estará disponível em breve. Se precisar, fale conosco pelo WhatsApp.');
        });
    }

    const instagramLinks = document.querySelectorAll('.social-icons a[href="#"]');
    instagramLinks.forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('[Social] Instagram link clicked but profile is not configured yet');
            alert('Nosso Instagram será publicado em breve.');
        });
    });

    // Add visual feedback to cart icon
    const cartIcon = document.querySelector('.fa-bag-shopping')?.parentElement;
    const cartCount = document.querySelector('.cart-count');
    
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', () => {
            // Simulate adding items (using 2 per click as a demo)
            let count = parseInt(cartCount.innerText, 10);
            cartCount.innerText = count + 2;
            console.log('[Cart] Demo add to cart triggered. New count:', cartCount.innerText);
            
            // Notification effect
            cartCount.style.transform = 'scale(1.5)';
            setTimeout(() => {
                cartCount.style.transform = 'scale(1)';
            }, 300);
        });
    });

});
