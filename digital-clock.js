/*
 * Digital Clock Web Component
 * A customizable digital clock that displays the current time with optional seconds
 * and blinking colons. Respects user preferences for color scheme.
 * Uses a closed shadow DOM for encapsulation while remaining customizable via CSS custom properties.
 *
 * Usage: <digital-clock show-seconds blink-rate="2"></digital-clock>
 *
 * Attributes:
 * show-seconds: Boolean attribute - display seconds if present
 * blink-rate: Number - blink frequency in Hz (default: 2, meaning blink every 500ms)
 *
 * CSS Custom Properties (set on the element or ancestor):
 * --digital-clock-font-size: Font size of the clock (default: 3rem)
 * --digital-clock-font-family: Font family (default: monospace)
 * --digital-clock-color: Text color of digits
 * --digital-clock-colon-color: Color of colons (default: same as text)
 * --digital-clock-background: Background color (default: transparent)
 * --digital-clock-padding: Padding around the clock (default: 1rem)
 * --digital-clock-border-radius: Border radius (default: 0.5rem)
 */

class DigitalClock extends HTMLElement {
    constructor() {
        super();

        // Create closed shadow DOM for encapsulation
        this._shadow = this.attachShadow({ mode: 'closed' });

        // State tracking
        this._updateInterval = null;
        this._blinkInterval = null;
        this._colonVisible = true;
        this._lastTimeString = '';
    }

    // Define observed attributes
    static get observedAttributes() {
        return ['show-seconds', 'blink-rate'];
    }

    connectedCallback() {
        this._render();
        this._startClock();
        this._startBlinking();
    }

    disconnectedCallback() {
        this._stopClock();
        this._stopBlinking();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === 'show-seconds') {
            this._updateDisplay();
        } else if (name === 'blink-rate') {
            this._stopBlinking();
            this._startBlinking();
        }
    }

    _render() {
        // Add styles to shadow DOM
        const style = document.createElement('style');
        style.textContent = `
            :host {
                display: inline-block;
                color-scheme: light dark;
            }

            .digital-clock-container {
                font-family: var(--digital-clock-font-family, monospace);
                font-size: var(--digital-clock-font-size, 3rem);
                color: var(--digital-clock-color, currentColor);
                background: var(--digital-clock-background, transparent);
                padding: var(--digital-clock-padding, 1rem);
                border-radius: var(--digital-clock-border-radius, 0.5rem);
                user-select: none;
                font-variant-numeric: tabular-nums;
                transition: color 0.3s ease, background 0.3s ease;
            }

            .digital-clock-display {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.1em;
            }

            .digital-clock-segment {
                display: inline-block;
            }

            .digital-clock-colon {
                color: var(--digital-clock-colon-color, currentColor);
                transition: opacity 0.05s ease, color 0.3s ease;
            }

            .digital-clock-colon.hidden {
                opacity: 0;
            }
        `;
        this._shadow.appendChild(style);

        // Create clock container
        const container = document.createElement('div');
        container.className = 'digital-clock-container';
        container.setAttribute('role', 'timer');
        container.setAttribute('aria-live', 'off'); // Don't announce every second
        container.setAttribute('aria-label', 'Digital clock');

        const display = document.createElement('div');
        display.className = 'digital-clock-display';

        // Create segments for hours, minutes, and seconds
        const hoursSpan = document.createElement('span');
        hoursSpan.className = 'digital-clock-segment digital-clock-hours';

        const firstColonSpan = document.createElement('span');
        firstColonSpan.className = 'digital-clock-segment digital-clock-colon';
        firstColonSpan.textContent = ':';

        const minutesSpan = document.createElement('span');
        minutesSpan.className = 'digital-clock-segment digital-clock-minutes';

        const secondColonSpan = document.createElement('span');
        secondColonSpan.className = 'digital-clock-segment digital-clock-colon';
        secondColonSpan.textContent = ':';

        const secondsSpan = document.createElement('span');
        secondsSpan.className = 'digital-clock-segment digital-clock-seconds';

        display.appendChild(hoursSpan);
        display.appendChild(firstColonSpan);
        display.appendChild(minutesSpan);
        display.appendChild(secondColonSpan);
        display.appendChild(secondsSpan);

        container.appendChild(display);
        this._shadow.appendChild(container);

        // Store references
        this._hoursElement = hoursSpan;
        this._minutesElement = minutesSpan;
        this._secondsElement = secondsSpan;
        this._firstColonElement = firstColonSpan;
        this._secondColonElement = secondColonSpan;

        // Initial display
        this._updateDisplay();
    }

    _startClock() {
        // Update immediately
        this._updateDisplay();

        // Update every 100ms for smooth updates
        // (will only change display when time actually changes)
        this._updateInterval = setInterval(() => {
            this._updateDisplay();
        }, 100);
    }

    _stopClock() {
        if (this._updateInterval) {
            clearInterval(this._updateInterval);
            this._updateInterval = null;
        }
    }

    _startBlinking() {
        const blinkRate = this._getBlinkRate();
        if (blinkRate <= 0) {
            // No blinking
            this._colonVisible = true;
            this._updateColonVisibility();
            return;
        }

        // Blink rate is in Hz, so period = 1/Hz seconds
        // We want to toggle every half period (on/off cycle)
        const blinkPeriodMs = (1000 / blinkRate) / 2;

        this._blinkInterval = setInterval(() => {
            this._colonVisible = !this._colonVisible;
            this._updateColonVisibility();
        }, blinkPeriodMs);
    }

    _stopBlinking() {
        if (this._blinkInterval) {
            clearInterval(this._blinkInterval);
            this._blinkInterval = null;
        }
    }

    _getBlinkRate() {
        const rate = parseFloat(this.getAttribute('blink-rate'));
        return isNaN(rate) ? 2 : rate; // Default 2 Hz
    }

    _shouldShowSeconds() {
        return this.hasAttribute('show-seconds');
    }

    _updateDisplay() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();

        // Format with leading zeros
        const hoursStr = String(hours).padStart(2, '0');
        const minutesStr = String(minutes).padStart(2, '0');
        const secondsStr = String(seconds).padStart(2, '0');

        // Build time string to check if it changed
        const showSeconds = this._shouldShowSeconds();
        const timeString = showSeconds
            ? `${hoursStr}:${minutesStr}:${secondsStr}`
            : `${hoursStr}:${minutesStr}`;

        // Only update DOM if time changed
        if (timeString !== this._lastTimeString) {
            this._hoursElement.textContent = hoursStr;
            this._minutesElement.textContent = minutesStr;
            this._secondsElement.textContent = secondsStr;

            // Show/hide second colon and seconds based on attribute
            if (showSeconds) {
                this._secondColonElement.style.display = '';
                this._secondsElement.style.display = '';
            } else {
                this._secondColonElement.style.display = 'none';
                this._secondsElement.style.display = 'none';
            }

            this._lastTimeString = timeString;
        }
    }

    _updateColonVisibility() {
        const className = this._colonVisible ? '' : 'hidden';
        this._firstColonElement.className = 'digital-clock-segment digital-clock-colon ' + className;

        // Only update second colon if seconds are shown
        if (this._shouldShowSeconds()) {
            this._secondColonElement.className = 'digital-clock-segment digital-clock-colon ' + className;
        }
    }
}

// Register the custom element
customElements.define('digital-clock', DigitalClock);
