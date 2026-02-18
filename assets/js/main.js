// SmartSass Tech - Main JavaScript
// Handles navigation, search, and general UI interactions

document.addEventListener('DOMContentLoaded', function () {
    // Search functionality
    const searchInputs = document.querySelectorAll('.search-input');
    searchInputs.forEach(input => {
        input.addEventListener('input', handleSearch);
    });

    // Handle contact form submission
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }

    // Resource search on resources page
    const resourceSearch = document.getElementById('resource-search');
    if (resourceSearch) {
        resourceSearch.addEventListener('input', filterResources);
    }

    // Initialize device slider
    initDeviceSlider();
});

// Search handler
function handleSearch(e) {
    const query = e.target.value.toLowerCase();

    // If on resources page, filter resources
    const resourceGrid = document.getElementById('resource-grid');
    if (resourceGrid) {
        filterResources(e);
    }
}

// Filter resources based on search
function filterResources(e) {
    const query = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        const title = card.querySelector('.card-title').textContent.toLowerCase();
        const description = card.querySelector('.card-description').textContent.toLowerCase();

        if (title.includes(query) || description.includes(query)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Handle contact form
async function handleContactForm(e) {
    e.preventDefault();

    const formMessage = document.getElementById('form-message');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const message = document.getElementById('message').value;

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    formMessage.style.display = 'none';

    try {
        const response = await fetch('https://zwfsvjvpocpflmkmptji.supabase.co/functions/v1/send-notification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'contact',
                name,
                email,
                phone,
                message
            })
        });

        if (!response.ok) throw new Error('Failed to send message');

        // Show success message
        formMessage.style.display = 'block';
        formMessage.style.backgroundColor = '#d4edda';
        formMessage.style.color = '#155724';
        formMessage.style.border = '1px solid #c3e6cb';
        formMessage.innerHTML = `
            <strong>Thank you, ${name}!</strong><br>
            We've received your message and will get back to you at ${email} as soon as possible.
            <br><br>
            You can also call us directly at <strong>(585) 210-9758</strong> if you need immediate assistance.
        `;

        // Reset form
        e.target.reset();
    } catch (error) {
        console.error('Submission error:', error);
        formMessage.style.display = 'block';
        formMessage.style.backgroundColor = '#f8d7da';
        formMessage.style.color = '#721c24';
        formMessage.style.border = '1px solid #f5c6cb';
        formMessage.innerHTML = `
            <strong>Sorry!</strong> We encountered an error sending your message. 
            Please try again later or call us directly at <strong>(585) 210-9758</strong>.
        `;
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
        // Scroll to message
        formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Device Category Slider
function initDeviceSlider() {
    const sliderTrack = document.querySelector('.slider-track');
    const prevBtn = document.querySelector('.slider-arrow-prev');
    const nextBtn = document.querySelector('.slider-arrow-next');
    const sliderContainer = document.querySelector('.slider-container');

    if (!sliderTrack || !prevBtn || !nextBtn) return;

    const slides = document.querySelectorAll('.device-slide');
    const totalSlides = slides.length;
    let currentIndex = 0;
    let autoSlideInterval;
    let slidesPerView = 3;

    // Calculate slides per view based on window width
    function updateSlidesPerView() {
        const width = window.innerWidth;
        if (width < 768) {
            slidesPerView = 1;
        } else if (width < 1024) {
            slidesPerView = 2;
        } else if (width < 1440) {
            slidesPerView = 3;
        } else if (width < 1920) {
            slidesPerView = 4;
        } else {
            slidesPerView = 5;
        }
        updateSlider();
    }

    // Update slider position
    function updateSlider() {
        const slideWidth = 100 / slidesPerView;
        const offset = -currentIndex * slideWidth;
        sliderTrack.style.transform = `translateX(${offset}%)`;
    }

    // Go to next slide
    function nextSlide() {
        currentIndex = (currentIndex + 1) % (totalSlides - slidesPerView + 1);
        if (currentIndex === 0 && totalSlides > slidesPerView) {
            currentIndex = totalSlides - slidesPerView;
        }
        updateSlider();
    }

    // Go to previous slide
    function prevSlide() {
        currentIndex = currentIndex - 1;
        if (currentIndex < 0) {
            currentIndex = totalSlides - slidesPerView;
        }
        updateSlider();
    }

    // Auto advance slider
    function startAutoSlide() {
        autoSlideInterval = setInterval(nextSlide, 4000);
    }

    // Stop auto advance
    function stopAutoSlide() {
        clearInterval(autoSlideInterval);
    }

    // Event listeners
    nextBtn.addEventListener('click', () => {
        nextSlide();
        stopAutoSlide();
        startAutoSlide();
    });

    prevBtn.addEventListener('click', () => {
        prevSlide();
        stopAutoSlide();
        startAutoSlide();
    });

    // Pause on hover
    sliderContainer.addEventListener('mouseenter', stopAutoSlide);
    sliderContainer.addEventListener('mouseleave', startAutoSlide);

    // Touch/swipe support
    let touchStartX = 0;
    let touchEndX = 0;

    sliderTrack.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    sliderTrack.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });

    function handleSwipe() {
        if (touchEndX < touchStartX - 50) {
            nextSlide();
        }
        if (touchEndX > touchStartX + 50) {
            prevSlide();
        }
        stopAutoSlide();
        startAutoSlide();
    }

    // Update on window resize
    window.addEventListener('resize', updateSlidesPerView);

    // Initialize
    updateSlidesPerView();
    startAutoSlide();
}
