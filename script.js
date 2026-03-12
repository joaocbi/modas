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
                alert('Obrigado por se inscrever! Enviaremos as novidades para ' + input.value);
                input.value = '';
            }
        });
    }

    // Add visual feedback to cart icon
    const cartIcon = document.querySelector('.fa-bag-shopping').parentElement;
    const cartCount = document.querySelector('.cart-count');
    
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', () => {
            // Simulate adding items (using 2 per click as a demo)
            let count = parseInt(cartCount.innerText);
            cartCount.innerText = count + 2;
            
            // Notification effect
            cartCount.style.transform = 'scale(1.5)';
            setTimeout(() => {
                cartCount.style.transform = 'scale(1)';
            }, 300);
        });
    });

});
