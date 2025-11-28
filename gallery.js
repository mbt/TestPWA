/*
 * Web Components Gallery Module
 * Displays a carousel of featured components and a list of all components.
 */

const Gallery = (function() {
    // Constants
    const CAROUSEL_INTERVAL_MS = 5000; // Carousel auto-advance interval

    // Sample component data - will be replaced with real components
    const components = [
        {
            id: 'video-player-chapters',
            name: 'Video Player with Chapters',
            description: 'A fully-featured video player with chapter navigation via dropdown menu. Includes custom controls, progress bar, volume slider, and keyboard shortcuts.',
            dateAdded: '2025-11-25T12:00:00Z',
            tags: ['media', 'video', 'interactive', 'navigation'],
            featured: true
        },
        {
            id: 'digital-clock',
            name: 'Digital Clock',
            description: 'A customizable digital clock with optional seconds display and blinking colons. Configurable blink rate (default 2 Hz) and full CSS customization.',
            dateAdded: '2025-11-25T00:00:00Z',
            tags: ['time', 'display', 'interactive'],
            featured: true
        },
        {
            id: 'analog-clock',
            name: 'Analog Clock',
            description: 'An animated analog clock with smooth hand movement. Respects reduced motion preferences and is fully customizable with CSS.',
            dateAdded: '2025-11-24T00:00:00Z',
            tags: ['time', 'animation', 'interactive'],
            featured: true
        },
        {
            id: 'example-button',
            name: 'Example Button',
            description: 'A customizable button component with various styles and states.',
            dateAdded: '2025-01-15T00:00:00Z',
            tags: ['form', 'input', 'interactive'],
            featured: true
        },
        {
            id: 'example-card',
            name: 'Example Card',
            description: 'A flexible card component for displaying content with optional header and footer.',
            dateAdded: '2025-01-10T00:00:00Z',
            tags: ['layout', 'container'],
            featured: true
        },
        {
            id: 'example-modal',
            name: 'Example Modal',
            description: 'A modal dialog component with customizable content and animations.',
            dateAdded: '2025-01-05T00:00:00Z',
            tags: ['overlay', 'dialog', 'interactive'],
            featured: true
        },
        {
            id: 'example-tabs',
            name: 'Example Tabs',
            description: 'A tabbed interface component for organizing content into sections.',
            dateAdded: '2024-12-28T00:00:00Z',
            tags: ['navigation', 'layout'],
            featured: false
        },
        {
            id: 'example-accordion',
            name: 'Example Accordion',
            description: 'An expandable/collapsible content component for FAQ-style layouts.',
            dateAdded: '2024-12-20T00:00:00Z',
            tags: ['layout', 'interactive'],
            featured: false
        }
    ];

    let currentCarouselIndex = 0;
    let carouselInterval = null;

    // Get featured components (up to 5)
    const getFeaturedComponents = () => {
        return components.filter(c => c.featured).slice(0, 5);
    };

    // Get all components sorted by date (reverse chronological)
    const getComponentsSorted = () => {
        return [...components].sort((a, b) =>
            new Date(b.dateAdded) - new Date(a.dateAdded)
        );
    };

    // Create a component card element
    const createComponentCard = (component, isFeatured = false) => {
        const card = document.createElement('a');
        card.href = `#/components/${component.id}`;
        card.className = isFeatured ? 'component-card featured' : 'component-card';
        card.dataset.id = component.id;

        const title = document.createElement('h3');
        title.className = 'component-card-title';
        title.textContent = component.name;

        const description = document.createElement('p');
        description.className = 'component-card-description';
        description.textContent = component.description;

        const meta = document.createElement('div');
        meta.className = 'component-card-meta';

        const date = document.createElement('span');
        date.className = 'component-card-date';
        date.textContent = new Date(component.dateAdded).toLocaleDateString();

        const tags = document.createElement('div');
        tags.className = 'component-card-tags';
        component.tags.forEach(tag => {
            const tagEl = document.createElement('span');
            tagEl.className = 'component-tag';
            tagEl.textContent = tag;
            tags.appendChild(tagEl);
        });

        meta.appendChild(date);
        meta.appendChild(tags);

        card.appendChild(title);
        card.appendChild(description);
        card.appendChild(meta);

        return card;
    };

    // Create carousel navigation dots
    const createCarouselDots = (count) => {
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'carousel-dots';

        for (let i = 0; i < count; i++) {
            const dot = document.createElement('button');
            dot.className = 'carousel-dot';
            dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
            dot.dataset.index = i;
            if (i === 0) dot.classList.add('active');

            dot.addEventListener('click', () => {
                goToSlide(i);
            });

            dotsContainer.appendChild(dot);
        }

        return dotsContainer;
    };

    // Navigate to specific slide
    const goToSlide = (index) => {
        const featured = getFeaturedComponents();
        if (index < 0 || index >= featured.length) return;

        currentCarouselIndex = index;

        const track = document.querySelector('.carousel-track');
        if (track) {
            track.style.transform = `translateX(-${index * 100}%)`;
        }

        // Update dots
        const dots = document.querySelectorAll('.carousel-dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });

        // Reset interval
        if (carouselInterval) {
            clearInterval(carouselInterval);
            startCarouselAutoplay();
        }
    };

    // Move to next slide
    const nextSlide = () => {
        const featured = getFeaturedComponents();
        const nextIndex = (currentCarouselIndex + 1) % featured.length;
        goToSlide(nextIndex);
    };

    // Move to previous slide
    const prevSlide = () => {
        const featured = getFeaturedComponents();
        const prevIndex = (currentCarouselIndex - 1 + featured.length) % featured.length;
        goToSlide(prevIndex);
    };

    // Start carousel autoplay
    const startCarouselAutoplay = () => {
        carouselInterval = setInterval(nextSlide, CAROUSEL_INTERVAL_MS);
    };

    // Stop carousel autoplay
    const stopCarouselAutoplay = () => {
        if (carouselInterval) {
            clearInterval(carouselInterval);
            carouselInterval = null;
        }
    };

    // Create the carousel section
    const createCarousel = () => {
        const featured = getFeaturedComponents();
        if (featured.length === 0) return null;

        const section = document.createElement('section');
        section.className = 'carousel-section';

        const heading = document.createElement('h2');
        heading.className = 'section-heading';
        heading.textContent = 'Featured Components';

        const carousel = document.createElement('div');
        carousel.className = 'carousel';

        // Navigation buttons
        const prevBtn = document.createElement('button');
        prevBtn.className = 'carousel-btn carousel-btn-prev';
        prevBtn.innerHTML = '&#8249;';
        prevBtn.setAttribute('aria-label', 'Previous slide');
        prevBtn.addEventListener('click', prevSlide);

        const nextBtn = document.createElement('button');
        nextBtn.className = 'carousel-btn carousel-btn-next';
        nextBtn.innerHTML = '&#8250;';
        nextBtn.setAttribute('aria-label', 'Next slide');
        nextBtn.addEventListener('click', nextSlide);

        // Carousel track
        const track = document.createElement('div');
        track.className = 'carousel-track';

        featured.forEach(component => {
            const slide = document.createElement('div');
            slide.className = 'carousel-slide';
            slide.appendChild(createComponentCard(component, true));
            track.appendChild(slide);
        });

        const viewport = document.createElement('div');
        viewport.className = 'carousel-viewport';
        viewport.appendChild(track);

        carousel.appendChild(prevBtn);
        carousel.appendChild(viewport);
        carousel.appendChild(nextBtn);

        section.appendChild(heading);
        section.appendChild(carousel);
        section.appendChild(createCarouselDots(featured.length));

        // Pause autoplay on hover
        carousel.addEventListener('mouseenter', stopCarouselAutoplay);
        carousel.addEventListener('mouseleave', startCarouselAutoplay);

        return section;
    };

    // Create the component list section
    const createComponentList = () => {
        const sorted = getComponentsSorted();

        const section = document.createElement('section');
        section.className = 'component-list-section';

        const heading = document.createElement('h2');
        heading.className = 'section-heading';
        heading.textContent = 'All Components';

        const list = document.createElement('div');
        list.className = 'component-list';

        sorted.forEach(component => {
            list.appendChild(createComponentCard(component));
        });

        section.appendChild(heading);
        section.appendChild(list);

        return section;
    };

    // Initialize and render the gallery
    const render = (container) => {
        const gallery = document.createElement('div');
        gallery.className = 'gallery';

        // Back to home button
        const backBtn = document.createElement('a');
        backBtn.href = '#';
        backBtn.className = 'back-button';
        backBtn.innerHTML = '&larr; Back to Home';
        backBtn.style.textDecoration = 'none';

        const header = document.createElement('header');
        header.className = 'gallery-header';

        const title = document.createElement('h1');
        title.className = 'gallery-title';
        title.textContent = 'Web Components Gallery';

        const subtitle = document.createElement('p');
        subtitle.className = 'gallery-subtitle';
        subtitle.textContent = 'A collection of reusable Web Components for your projects';

        header.appendChild(title);
        header.appendChild(subtitle);

        gallery.appendChild(backBtn);
        gallery.appendChild(header);

        const carouselSection = createCarousel();
        if (carouselSection) {
            gallery.appendChild(carouselSection);
            startCarouselAutoplay();
        }

        gallery.appendChild(createComponentList());

        container.appendChild(gallery);
    };

    // Cleanup function
    const destroy = () => {
        stopCarouselAutoplay();
    };

    // Public API
    return {
        render,
        destroy,
        getComponents: () => [...components],
        addComponent: (component) => {
            components.push(component);
        }
    };
})();

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Gallery;
}
