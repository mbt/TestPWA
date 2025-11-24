/*
 * Theme Toggle Module
 * Handles manual light/dark mode switching with localStorage persistence.
 */

const ThemeToggle = (function() {
    const STORAGE_KEY = 'theme-preference';
    let toggleButton = null;

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

    // Apply theme to document
    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
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

    // Initialize the theme system
    const init = () => {
        const theme = getCurrentTheme();
        applyTheme(theme);
        createToggleButton();
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
