/*
 * Font Size Control Module
 * Handles font size adjustment with localStorage persistence.
 */

const FontSizeControl = (function() {
    const STORAGE_KEY = 'font-size-preference';
    const MIN_SIZE = 12;
    const MAX_SIZE = 24;
    const DEFAULT_SIZE = 16;
    const STEP = 2;

    let controlContainer = null;
    let currentSize = DEFAULT_SIZE;

    // Get the current font size (from localStorage or default)
    const getCurrentSize = () => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const size = parseInt(stored, 10);
            if (!isNaN(size) && size >= MIN_SIZE && size <= MAX_SIZE) {
                return size;
            }
        }
        return DEFAULT_SIZE;
    };

    // Apply font size to document
    const applyFontSize = (size) => {
        document.documentElement.style.fontSize = `${size}px`;
        currentSize = size;
        updateButtons();
    };

    // Save font size to localStorage
    const saveFontSize = (size) => {
        localStorage.setItem(STORAGE_KEY, size.toString());
    };

    // Increase font size
    const increase = () => {
        const newSize = Math.min(currentSize + STEP, MAX_SIZE);
        if (newSize !== currentSize) {
            applyFontSize(newSize);
            saveFontSize(newSize);
        }
    };

    // Decrease font size
    const decrease = () => {
        const newSize = Math.max(currentSize - STEP, MIN_SIZE);
        if (newSize !== currentSize) {
            applyFontSize(newSize);
            saveFontSize(newSize);
        }
    };

    // Reset to default font size
    const reset = () => {
        applyFontSize(DEFAULT_SIZE);
        saveFontSize(DEFAULT_SIZE);
    };

    // Update button states (disabled when at limits)
    const updateButtons = () => {
        if (!controlContainer) return;

        const decreaseBtn = controlContainer.querySelector('.font-decrease');
        const increaseBtn = controlContainer.querySelector('.font-increase');

        if (decreaseBtn) {
            decreaseBtn.disabled = currentSize <= MIN_SIZE;
        }
        if (increaseBtn) {
            increaseBtn.disabled = currentSize >= MAX_SIZE;
        }
    };

    // Create the font size control buttons
    const createControls = () => {
        controlContainer = document.createElement('div');
        controlContainer.className = 'font-size-control';
        controlContainer.setAttribute('role', 'group');
        controlContainer.setAttribute('aria-label', 'Font size controls');

        // Decrease button
        const decreaseBtn = document.createElement('button');
        decreaseBtn.className = 'font-size-btn font-decrease';
        decreaseBtn.setAttribute('type', 'button');
        decreaseBtn.setAttribute('aria-label', 'Decrease font size');
        decreaseBtn.innerHTML = 'A−';
        decreaseBtn.addEventListener('click', decrease);

        // Reset button (double-click)
        const resetBtn = document.createElement('button');
        resetBtn.className = 'font-size-btn font-reset';
        resetBtn.setAttribute('type', 'button');
        resetBtn.setAttribute('aria-label', 'Reset font size to default');
        resetBtn.innerHTML = 'A';
        resetBtn.addEventListener('click', reset);
        resetBtn.title = 'Reset to default size';

        // Increase button
        const increaseBtn = document.createElement('button');
        increaseBtn.className = 'font-size-btn font-increase';
        increaseBtn.setAttribute('type', 'button');
        increaseBtn.setAttribute('aria-label', 'Increase font size');
        increaseBtn.innerHTML = 'A+';
        increaseBtn.addEventListener('click', increase);

        controlContainer.appendChild(decreaseBtn);
        controlContainer.appendChild(resetBtn);
        controlContainer.appendChild(increaseBtn);

        document.body.appendChild(controlContainer);
        updateButtons();
    };

    // Initialize the font size system
    const init = () => {
        const size = getCurrentSize();
        applyFontSize(size);
        createControls();
    };

    // Public API
    return {
        init,
        getCurrentSize,
        increase,
        decrease,
        reset
    };
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', FontSizeControl.init);
} else {
    FontSizeControl.init();
}

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FontSizeControl;
}
