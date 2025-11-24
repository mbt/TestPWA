/*
 * Theme Toggle Module
 * Handles manual light/dark mode switching with localStorage persistence.
 */

const ThemeToggle = (function() {
    const STORAGE_KEY = 'theme-preference';
    let toggleButton = null;
    let systemThemeMediaQuery = null;

    // Get the current theme (from localStorage or system preference)
    const getCurrentTheme = () => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return stored;
        }

        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            return 'light';
        }

        return 'dark';
    };

    // Check if using manual override
    const hasManualOverride = () => {
        return localStorage.getItem(STORAGE_KEY) !== null;
    };

    // Apply theme to document
    const applyTheme = (theme) => {
        if (hasManualOverride()) {
            // Use manual override
            document.documentElement.setAttribute('data-theme', theme);
        } else {
            // No override - remove attribute to use system preference
            document.documentElement.removeAttribute('data-theme');
        }
        updateToggleButton(theme);
    };

    // Update the toggle button icon
    const updateToggleButton = (theme) => {
        if (!toggleButton) return;

        if (theme === 'light') {
            toggleButton.innerHTML = '🌙'; // Moon for dark mode option
            toggleButton.setAttribute('aria-label', 'Switch to dark mode');
        } else {
            toggleButton.innerHTML = '☀️'; // Sun for light mode option
            toggleButton.setAttribute('aria-label', 'Switch to light mode');
        }
    };

    // Handle system theme changes
    const handleSystemThemeChange = (e) => {
        // Only respond to system changes if there's no manual override
        if (!hasManualOverride()) {
            const newTheme = e.matches ? 'light' : 'dark';
            applyTheme(newTheme);
        }
    };

    // Toggle between themes
    const toggleTheme = () => {
        const currentTheme = getCurrentTheme();
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        localStorage.setItem(STORAGE_KEY, newTheme);
        applyTheme(newTheme);
    };

    // Create the toggle button
    const createToggleButton = () => {
        toggleButton = document.createElement('button');
        toggleButton.className = 'theme-toggle';
        toggleButton.setAttribute('type', 'button');

        const currentTheme = getCurrentTheme();
        updateToggleButton(currentTheme);

        toggleButton.addEventListener('click', toggleTheme);

        document.body.appendChild(toggleButton);
    };

    // Set up system theme change listener
    const setupSystemThemeListener = () => {
        if (window.matchMedia) {
            systemThemeMediaQuery = window.matchMedia('(prefers-color-scheme: light)');

            // Modern browsers
            if (systemThemeMediaQuery.addEventListener) {
                systemThemeMediaQuery.addEventListener('change', handleSystemThemeChange);
            } else if (systemThemeMediaQuery.addListener) {
                // Older browsers
                systemThemeMediaQuery.addListener(handleSystemThemeChange);
            }
        }
    };

    // Initialize the theme system
    const init = () => {
        const theme = getCurrentTheme();
        applyTheme(theme);
        createToggleButton();
        setupSystemThemeListener();
    };

    // Public API
    return {
        init,
        getCurrentTheme,
        toggleTheme
    };
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ThemeToggle.init);
} else {
    ThemeToggle.init();
}

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeToggle;
}
