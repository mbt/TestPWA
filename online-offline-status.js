/*
 * Online/Offline Status Indicator Module
 * Displays connection status in bottom-right corner of viewport.
 */

const OnlineOfflineStatus = (function() {
    let statusIndicator = null;
    let statusText = null;
    let statusIcon = null;
    let hideTimeout = null;

    // Check if currently online
    const isOnline = () => {
        return navigator.onLine;
    };

    // Update the status indicator
    const updateStatus = (showTemporarily = false) => {
        if (!statusIndicator) return;

        const online = isOnline();

        // Update classes
        if (online) {
            statusIndicator.classList.remove('offline');
            statusIndicator.classList.add('online');
            statusIcon.textContent = '●';
            statusText.textContent = 'Online';
            statusIndicator.setAttribute('aria-label', 'Connection status: Online');
        } else {
            statusIndicator.classList.remove('online');
            statusIndicator.classList.add('offline');
            statusIcon.textContent = '●';
            statusText.textContent = 'Offline';
            statusIndicator.setAttribute('aria-label', 'Connection status: Offline');
        }

        // Show the indicator
        statusIndicator.classList.add('visible');

        // Clear any existing timeout
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
        }

        // If showing temporarily (on status change), hide after 5 seconds when online
        if (showTemporarily && online) {
            hideTimeout = setTimeout(() => {
                statusIndicator.classList.remove('visible');
            }, 5000);
        } else if (!online) {
            // Keep visible while offline
            statusIndicator.classList.add('visible');
        }
    };

    // Handle online event
    const handleOnline = () => {
        updateStatus(true);
    };

    // Handle offline event
    const handleOffline = () => {
        updateStatus(true);
    };

    // Create the status indicator element
    const createIndicator = () => {
        statusIndicator = document.createElement('div');
        statusIndicator.className = 'connection-status';
        statusIndicator.setAttribute('role', 'status');
        statusIndicator.setAttribute('aria-live', 'polite');

        statusIcon = document.createElement('span');
        statusIcon.className = 'status-icon';

        statusText = document.createElement('span');
        statusText.className = 'status-text';

        statusIndicator.appendChild(statusIcon);
        statusIndicator.appendChild(statusText);

        document.body.appendChild(statusIndicator);
    };

    // Set up event listeners
    const setupListeners = () => {
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Optional: periodically check connection status
        // This can catch cases where the browser's navigator.onLine is inaccurate
        setInterval(() => {
            const currentOnlineState = isOnline();
            const indicatorShowsOnline = statusIndicator && statusIndicator.classList.contains('online');

            // Only update if state has changed
            if (currentOnlineState !== indicatorShowsOnline) {
                updateStatus(true);
            }
        }, 30000); // Check every 30 seconds
    };

    // Initialize the status indicator
    const init = () => {
        createIndicator();
        setupListeners();

        // Initial status update - show briefly on page load
        updateStatus(true);
    };

    // Public API
    return {
        init,
        isOnline,
        updateStatus
    };
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', OnlineOfflineStatus.init);
} else {
    OnlineOfflineStatus.init();
}

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OnlineOfflineStatus;
}
