/*
 * The application's bootstrap code.
 */

(function() {
    // Constants
    const LOADING_DISPLAY_TIME = 350; // ms
    const LOADING_HIDE_TIME = 250; // ms
    const STARTUP_DELAY = 1000; // ms

    const body = document.getElementsByTagName('body')[0];
    let loaded = false;
    let appContainer = null;

    const stopLoadingMessage = () => {
        loaded = true;
    }

    const removeLoading = () => {
        console.log("Removing the loading message...");
        let msgLoading = document.getElementById('msgLoading');

        // Check if element exists before removing
        if (msgLoading) {
            msgLoading.remove();
        }

        // Only continue the loop if not loaded
        if (!loaded) {
            setTimeout(displayLoading, LOADING_HIDE_TIME);
        }
    }

    const displayLoading = () => {
        if(loaded) {
            console.log("Stopping the loading message now.");
            return;
        }

        console.log("Displaying the loading message...");

        let msgLoading = document.createElement('p');
        msgLoading.id = 'msgLoading';
        msgLoading.innerText = 'Application is loading, please wait...';

        body.appendChild(msgLoading);
        setTimeout(removeLoading, LOADING_DISPLAY_TIME);
    }

    // Register service worker for PWA functionality
    const registerServiceWorker = async () => {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered successfully:', registration.scope);
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    // Router functionality
    const Router = {
        routes: {},
        currentView: null,

        // Register a route
        register: function(path, handler) {
            this.routes[path] = handler;
        },

        // Navigate to a path
        navigate: function(path) {
            window.location.hash = path;
        },

        // Render current route
        render: function() {
            // Get hash without the # symbol, default to empty string
            const hash = window.location.hash.slice(1) || '';

            // Clear current view
            if (this.currentView && this.currentView.destroy) {
                this.currentView.destroy();
            }
            if (appContainer) {
                appContainer.innerHTML = '';
            }

            // Check for component detail route
            const componentMatch = hash.match(/^\/components\/([^/]+)$/);
            if (componentMatch) {
                const componentId = componentMatch[1];
                this.routes['/components/:id'](componentId);
                return;
            }

            // Check for prompt detail/edit route
            const promptMatch = hash.match(/^\/prompts\/([^/]+)$/);
            if (promptMatch) {
                const promptId = promptMatch[1];
                this.routes['/prompts/:id'](promptId);
                return;
            }

            // Check for prompts gallery route
            if (hash === '/prompts') {
                this.routes['/prompts']();
                return;
            }

            // Check for gallery route
            if (hash === '/gallery') {
                this.routes['/gallery']();
                return;
            }

            // Default to home route
            if (this.routes['']) {
                this.routes['']();
            }
        }
    };

    // Home view
    Router.register('', function() {
        Router.currentView = Home;
        Home.render(appContainer);
    });

    // Gallery view
    Router.register('/gallery', function() {
        Router.currentView = Gallery;
        Gallery.render(appContainer);
    });

    // Component detail view
    Router.register('/components/:id', function(componentId) {
        const components = Gallery.getComponents();
        const component = components.find(c => c.id === componentId);

        if (!component) {
            // Component not found, redirect to gallery
            Router.navigate('/');
            return;
        }

        // Create component detail view
        const detailView = document.createElement('div');
        detailView.className = 'component-detail';

        // Back button
        const backBtn = document.createElement('a');
        backBtn.href = '#/gallery';
        backBtn.className = 'back-button';
        backBtn.innerHTML = '&larr; Back to Gallery';
        backBtn.style.textDecoration = 'none';

        // Component header
        const header = document.createElement('header');
        header.className = 'component-detail-header';

        const title = document.createElement('h1');
        title.className = 'component-detail-title';
        title.textContent = component.name;

        const meta = document.createElement('div');
        meta.className = 'component-detail-meta';

        const date = document.createElement('span');
        date.className = 'component-detail-date';
        date.textContent = `Added: ${new Date(component.dateAdded).toLocaleDateString()}`;

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

        header.appendChild(title);
        header.appendChild(meta);

        // Component description
        const description = document.createElement('p');
        description.className = 'component-detail-description';
        description.textContent = component.description;

        // Demo and Documentation section
        const demoSection = document.createElement('section');
        demoSection.className = 'component-demo-section';

        // Get comprehensive demo content from ComponentDemos module
        const demoContent = ComponentDemos.getDemoContent(component.id);
        demoSection.appendChild(demoContent);

        // Assemble the view
        detailView.appendChild(backBtn);
        detailView.appendChild(header);
        detailView.appendChild(description);
        detailView.appendChild(demoSection);

        appContainer.appendChild(detailView);

        Router.currentView = {
            destroy: () => {
                // Cleanup if needed
            }
        };
    });

    // Prompt Gallery view
    Router.register('/prompts', function() {
        Router.currentView = PromptGallery;
        PromptGallery.render();
    });

    // Prompt detail view
    Router.register('/prompts/:id', function(promptId) {
        Router.currentView = PromptDetail;
        PromptDetail.render(promptId);
    });

    // Handle hash changes (browser back/forward buttons and direct hash changes)
    window.addEventListener('hashchange', () => {
        Router.render();
    });

    // Make router globally accessible for gallery
    window.AppRouter = Router;

    // The application entrypoint.
    const startup = () => {
        displayLoading();
        registerServiceWorker();

        // Create app container
        appContainer = document.createElement('div');
        appContainer.id = 'app';
        body.appendChild(appContainer);

        // Initialize the router
        setTimeout(() => {
            stopLoadingMessage();
            Router.render();
        }, STARTUP_DELAY);
    }

    // Call startup when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startup);
    } else {
        startup();
    }
})();