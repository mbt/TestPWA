/*
 * Home/Landing Page Module
 * Displays a welcome page with a call-to-action to view the gallery.
 */

const Home = (function() {
    // Initialize and render the home page
    const render = (container) => {
        const home = document.createElement('div');
        home.className = 'home';

        // Hero section
        const hero = document.createElement('section');
        hero.className = 'home-hero';

        const title = document.createElement('h1');
        title.className = 'home-title';
        title.textContent = 'Web Components Toolbox';

        const tagline = document.createElement('p');
        tagline.className = 'home-tagline';
        tagline.textContent = 'A collection of reusable, framework-free Web Components for modern web development';

        const cta = document.createElement('a');
        cta.href = '#/gallery';
        cta.className = 'home-cta';
        cta.textContent = 'Explore Components';

        hero.appendChild(title);
        hero.appendChild(tagline);
        hero.appendChild(cta);

        // Features section
        const features = document.createElement('section');
        features.className = 'home-features';

        const featuresData = [
            {
                title: 'Framework-Free',
                description: 'Pure Web Components built with vanilla JavaScript. No dependencies, no build tools required.'
            },
            {
                title: 'Fully Encapsulated',
                description: 'Shadow DOM ensures styles and behavior remain isolated and conflict-free.'
            },
            {
                title: 'Customizable',
                description: 'Easily customize appearance using CSS custom properties while maintaining encapsulation.'
            },
            {
                title: 'Accessible',
                description: 'Built with accessibility in mind, respecting user preferences and ARIA standards.'
            }
        ];

        featuresData.forEach(feature => {
            const featureEl = document.createElement('div');
            featureEl.className = 'home-feature';

            const featureTitle = document.createElement('h3');
            featureTitle.textContent = feature.title;

            const featureDesc = document.createElement('p');
            featureDesc.textContent = feature.description;

            featureEl.appendChild(featureTitle);
            featureEl.appendChild(featureDesc);
            features.appendChild(featureEl);
        });

        home.appendChild(hero);
        home.appendChild(features);

        container.appendChild(home);
    };

    // Cleanup function
    const destroy = () => {
        // No cleanup needed for home page
    };

    // Public API
    return {
        render,
        destroy
    };
})();

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Home;
}
