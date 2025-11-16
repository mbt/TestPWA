/*
 * The application's bootstrap code.
 */

(function() {
    const body = document.getElementsByTagName('body')[0];
    const displayTime = 350;
    const hideTime = 250;
    let loaded = false;

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
            setTimeout(displayLoading, hideTime);
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
        setTimeout(removeLoading, displayTime);
    }

    // Register service worker for PWA functionality
    const registerServiceWorker = async () => {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('sw.js');
                console.log('Service Worker registered successfully:', registration.scope);
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    // The application entrypoint.
    const startup = () => {
        displayLoading();
        registerServiceWorker();

        // Simulate app loading, then stop the loading message
        setTimeout(stopLoadingMessage, 2000);
    }

    // Call startup when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startup);
    } else {
        startup();
    }
})();