/*
 * Digital Clock Web Component
 * A customizable digital clock displaying hours, minutes, seconds, and optional date.
 * Respects user preferences for 12/24-hour format and color scheme.
 * Uses a closed shadow DOM for encapsulation while remaining customizable via CSS custom properties.
 *
 * Usage: <digital-clock></digital-clock>
 *
 * Attributes:
 * - format: "12" or "24" (default: "24")
 * - show-seconds: "true" or "false" (default: "true")
 * - show-date: "true" or "false" (default: "false")
 * - blink-separator: "true" or "false" (default: "true")
 *
 * CSS Custom Properties (set on the element or ancestor):
 * --digital-clock-font-family: Font family (default: monospace)
 * --digital-clock-font-size: Font size for time (default: 3rem)
 * --digital-clock-date-font-size: Font size for date (default: 1rem)
 * --digital-clock-text-color: Color of text
 * --digital-clock-background-color: Background color
 * --digital-clock-border-color: Border color
 * --digital-clock-border-width: Border width (default: 1px)
 * --digital-clock-border-radius: Border radius (default: 8px)
 * --digital-clock-padding: Padding inside clock (default: 1rem)
 * --digital-clock-separator-color: Color of time separator (default: same as text)
 */

class DigitalClock extends HTMLElement {
    constructor() {
        super();

        // Create closed shadow DOM for encapsulation
        this._shadow = this.attachShadow({ mode: 'closed' });

        this._intervalId = null;
        this._timeElement = null;
        this._dateElement = null;
        this._separatorElements = [];
    }

    // Observed attributes - component will re-render when these change
    static get observedAttributes() {
        return ['format', 'show-seconds', 'show-date', 'blink-separator'];
    }

    connectedCallback() {
        this._render();
        this._startClock();
    }

    disconnectedCallback() {
        this._stopClock();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this._shadow.children.length > 0) {
            this._render();
        }
    }

    // Get attribute helpers
    _getFormat() {
        const format = this.getAttribute('format');
        return format === '12' ? 12 : 24;
    }

    _shouldShowSeconds() {
        return this.getAttribute('show-seconds') !== 'false';
    }

    _shouldShowDate() {
        return this.getAttribute('show-date') === 'true';
    }

    _shouldBlinkSeparator() {
        return this.getAttribute('blink-separator') !== 'false';
    }

    _render() {
        // Clear existing content
        this._shadow.innerHTML = '';

        const style = document.createElement('style');
        style.textContent = `
            :host {
                display: inline-block;
                font-family: var(--digital-clock-font-family, 'Courier New', Courier, monospace);
            }

            .clock-container {
                background-color: var(--digital-clock-background-color, transparent);
                border: var(--digital-clock-border-width, 1px) solid var(--digital-clock-border-color, currentColor);
                border-radius: var(--digital-clock-border-radius, 8px);
                padding: var(--digital-clock-padding, 1rem);
                display: inline-flex;
                flex-direction: column;
                align-items: center;
                gap: 0.5rem;
            }

            .time {
                font-size: var(--digital-clock-font-size, 3rem);
                font-weight: bold;
                color: var(--digital-clock-text-color, currentColor);
                line-height: 1;
                letter-spacing: 0.05em;
                display: flex;
                align-items: center;
            }

            .separator {
                color: var(--digital-clock-separator-color, var(--digital-clock-text-color, currentColor));
                opacity: 1;
                transition: opacity 0.1s ease-in-out;
            }

            .separator.blink {
                opacity: 0;
            }

            .ampm {
                font-size: 0.4em;
                margin-left: 0.3em;
                font-weight: normal;
            }

            .date {
                font-size: var(--digital-clock-date-font-size, 1rem);
                color: var(--digital-clock-text-color, currentColor);
                opacity: 0.8;
            }
        `;

        const container = document.createElement('div');
        container.className = 'clock-container';

        this._timeElement = document.createElement('div');
        this._timeElement.className = 'time';

        container.appendChild(this._timeElement);

        if (this._shouldShowDate()) {
            this._dateElement = document.createElement('div');
            this._dateElement.className = 'date';
            container.appendChild(this._dateElement);
        }

        this._shadow.appendChild(style);
        this._shadow.appendChild(container);

        // Initial update
        this._updateTime();
    }

    _formatTime(date) {
        const format = this._getFormat();
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();
        let ampm = '';

        if (format === 12) {
            ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // 0 should be 12
        }

        const pad = (num) => String(num).padStart(2, '0');

        const parts = [pad(hours), pad(minutes)];
        if (this._shouldShowSeconds()) {
            parts.push(pad(seconds));
        }

        return { parts, ampm };
    }

    _formatDate(date) {
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return date.toLocaleDateString(undefined, options);
    }

    _updateTime() {
        if (!this._timeElement) return;

        const now = new Date();
        const { parts, ampm } = this._formatTime(now);

        // Clear and rebuild time display
        this._timeElement.innerHTML = '';
        this._separatorElements = [];

        parts.forEach((part, index) => {
            const span = document.createElement('span');
            span.textContent = part;
            this._timeElement.appendChild(span);

            if (index < parts.length - 1) {
                const separator = document.createElement('span');
                separator.className = 'separator';
                separator.textContent = ':';
                this._separatorElements.push(separator);
                this._timeElement.appendChild(separator);
            }
        });

        if (ampm) {
            const ampmSpan = document.createElement('span');
            ampmSpan.className = 'ampm';
            ampmSpan.textContent = ampm;
            this._timeElement.appendChild(ampmSpan);
        }

        // Update date if shown
        if (this._dateElement) {
            this._dateElement.textContent = this._formatDate(now);
        }

        // Handle blinking separator
        if (this._shouldBlinkSeparator()) {
            const shouldBlink = now.getSeconds() % 2 === 0;
            this._separatorElements.forEach(sep => {
                sep.classList.toggle('blink', shouldBlink);
            });
        }
    }

    _startClock() {
        this._stopClock();
        this._updateTime();
        this._intervalId = setInterval(() => this._updateTime(), 1000);
    }

    _stopClock() {
        if (this._intervalId) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }
    }

    // Public API for programmatic control
    start() {
        this._startClock();
    }

    stop() {
        this._stopClock();
    }
}

// Register the custom element
customElements.define('digital-clock', DigitalClock);

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DigitalClock;
}
