/*
 * Analog Clock Web Component
 * A customizable analog clock that respects user preferences for color scheme and reduced motion.
 * Uses a closed shadow DOM for encapsulation while remaining customizable via CSS custom properties.
 *
 * Usage: <analog-clock></analog-clock>
 *
 * CSS Custom Properties (set on the element or ancestor):
 * --analog-clock-size: Size of the clock (default: 200px)
 * --analog-clock-face-color: Background color of clock face
 * --analog-clock-border-color: Border color of clock
 * --analog-clock-border-width: Border width (default: 2px)
 * --analog-clock-hand-color: Color of hour and minute hands
 * --analog-clock-second-hand-color: Color of second hand
 * --analog-clock-tick-color: Color of hour markers
 * --analog-clock-center-color: Color of center dot
 * --analog-clock-number-color: Color of hour numbers (default: currentColor)
 * --analog-clock-font-family: Font family for numbers (default: system sans-serif)
 * --analog-clock-font-size: Font size for numbers (default: 10px)
 * --analog-clock-font-weight: Font weight for numbers (default: 400)
 */

class AnalogClock extends HTMLElement {
    constructor() {
        super();

        // Create closed shadow DOM for encapsulation
        this._shadow = this.attachShadow({ mode: 'closed' });

        // Track cumulative rotations to avoid backwards winding
        this._hourRotation = 0;
        this._minuteRotation = 0;
        this._secondRotation = 0;
        this._lastSecond = -1;
        this._lastMinute = -1;
        this._lastHour = -1;

        this._animationFrameId = null;
        this._reducedMotion = false;
        this._mediaQuery = null;
    }

    connectedCallback() {
        this._render();
        this._setupReducedMotionListener();
        this._startClock();
    }

    disconnectedCallback() {
        this._stopClock();
        this._removeReducedMotionListener();
    }

    _render() {
        // Add styles to shadow DOM
        const style = document.createElement('style');
        style.textContent = `
            :host {
                display: inline-block;
                width: var(--analog-clock-size, 200px);
                height: var(--analog-clock-size, 200px);
                color-scheme: light dark;
            }

            .analog-clock-svg {
                width: 100%;
                height: 100%;
                display: block;
            }

            .analog-clock-face {
                fill: var(--analog-clock-face-color, Canvas);
                stroke: var(--analog-clock-border-color, currentColor);
                stroke-width: var(--analog-clock-border-width, 2);
            }

            .analog-clock-tick {
                stroke: var(--analog-clock-tick-color, currentColor);
                stroke-width: 1.5;
                stroke-linecap: round;
            }

            .analog-clock-number {
                fill: var(--analog-clock-number-color, currentColor);
                font-family: var(--analog-clock-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif);
                font-size: var(--analog-clock-font-size, 10px);
                font-weight: var(--analog-clock-font-weight, 400);
                user-select: none;
            }

            .analog-clock-hand {
                stroke-linecap: round;
            }

            .analog-clock-hour-hand {
                stroke: var(--analog-clock-hand-color, currentColor);
                stroke-width: 3;
            }

            .analog-clock-minute-hand {
                stroke: var(--analog-clock-hand-color, currentColor);
                stroke-width: 2;
            }

            .analog-clock-second-hand {
                stroke: var(--analog-clock-second-hand-color, currentColor);
                stroke-width: 1;
            }

            .analog-clock-center {
                fill: var(--analog-clock-center-color, currentColor);
            }
        `;
        this._shadow.appendChild(style);

        // Create SVG clock face
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.setAttribute('class', 'analog-clock-svg');
        svg.setAttribute('role', 'img');
        svg.setAttribute('aria-label', 'Analog clock');

        // Clock face background
        const face = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        face.setAttribute('cx', '50');
        face.setAttribute('cy', '50');
        face.setAttribute('r', '48');
        face.setAttribute('class', 'analog-clock-face');
        svg.appendChild(face);

        // Hour markers
        for (let i = 0; i < 12; i++) {
            const angle = (i * 30) * (Math.PI / 180);
            const innerRadius = 42;
            const outerRadius = 46;

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', 50 + innerRadius * Math.sin(angle));
            line.setAttribute('y1', 50 - innerRadius * Math.cos(angle));
            line.setAttribute('x2', 50 + outerRadius * Math.sin(angle));
            line.setAttribute('y2', 50 - outerRadius * Math.cos(angle));
            line.setAttribute('class', 'analog-clock-tick');
            svg.appendChild(line);
        }

        // Hour numbers
        for (let i = 1; i <= 12; i++) {
            const angle = ((i * 30) - 90) * (Math.PI / 180); // -90 to start at 12 o'clock
            const numberRadius = 35; // Position numbers inside the tick marks

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', 50 + numberRadius * Math.cos(angle));
            text.setAttribute('y', 50 + numberRadius * Math.sin(angle));
            text.setAttribute('class', 'analog-clock-number');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'central');
            text.textContent = i;
            svg.appendChild(text);
        }

        // Hour hand
        const hourHand = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        hourHand.setAttribute('x1', '50');
        hourHand.setAttribute('y1', '50');
        hourHand.setAttribute('x2', '50');
        hourHand.setAttribute('y2', '26');
        hourHand.setAttribute('class', 'analog-clock-hand analog-clock-hour-hand');
        svg.appendChild(hourHand);
        this._hourHand = hourHand;

        // Minute hand
        const minuteHand = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        minuteHand.setAttribute('x1', '50');
        minuteHand.setAttribute('y1', '50');
        minuteHand.setAttribute('x2', '50');
        minuteHand.setAttribute('y2', '16');
        minuteHand.setAttribute('class', 'analog-clock-hand analog-clock-minute-hand');
        svg.appendChild(minuteHand);
        this._minuteHand = minuteHand;

        // Second hand
        const secondHand = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        secondHand.setAttribute('x1', '50');
        secondHand.setAttribute('y1', '50');
        secondHand.setAttribute('x2', '50');
        secondHand.setAttribute('y2', '12');
        secondHand.setAttribute('class', 'analog-clock-hand analog-clock-second-hand');
        svg.appendChild(secondHand);
        this._secondHand = secondHand;

        // Center dot
        const center = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        center.setAttribute('cx', '50');
        center.setAttribute('cy', '50');
        center.setAttribute('r', '2');
        center.setAttribute('class', 'analog-clock-center');
        svg.appendChild(center);

        this._shadow.appendChild(svg);

        // Initialize rotations based on current time
        this._initializeRotations();
    }

    _initializeRotations() {
        const now = new Date();
        const hours = now.getHours() % 12;
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        const milliseconds = now.getMilliseconds();

        // Set initial cumulative rotations
        this._lastSecond = seconds;
        this._lastMinute = minutes;
        this._lastHour = hours;

        // Calculate initial positions
        if (this._reducedMotion) {
            this._secondRotation = seconds * 6;
        } else {
            this._secondRotation = (seconds * 6) + (milliseconds * 0.006);
        }
        this._minuteRotation = (minutes * 6) + (seconds * 0.1);
        this._hourRotation = (hours * 30) + (minutes * 0.5);
    }

    _setupReducedMotionListener() {
        this._mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        this._reducedMotion = this._mediaQuery.matches;

        this._motionChangeHandler = (e) => {
            this._reducedMotion = e.matches;
        };

        this._mediaQuery.addEventListener('change', this._motionChangeHandler);
    }

    _removeReducedMotionListener() {
        if (this._mediaQuery && this._motionChangeHandler) {
            this._mediaQuery.removeEventListener('change', this._motionChangeHandler);
        }
    }

    _startClock() {
        const update = () => {
            this._updateHands();
            this._animationFrameId = requestAnimationFrame(update);
        };
        this._animationFrameId = requestAnimationFrame(update);
    }

    _stopClock() {
        if (this._animationFrameId) {
            cancelAnimationFrame(this._animationFrameId);
            this._animationFrameId = null;
        }
    }

    _updateHands() {
        const now = new Date();
        const hours = now.getHours() % 12;
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        const milliseconds = now.getMilliseconds();

        // Calculate target rotations
        let targetSecondRotation, targetMinuteRotation, targetHourRotation;

        if (this._reducedMotion) {
            // Ticking motion - discrete steps
            targetSecondRotation = seconds * 6;
        } else {
            // Smooth motion - include milliseconds
            targetSecondRotation = (seconds * 6) + (milliseconds * 0.006);
        }

        targetMinuteRotation = (minutes * 6) + (seconds * 0.1);
        targetHourRotation = (hours * 30) + (minutes * 0.5);

        // Handle wraparound for seconds (59 -> 0)
        if (this._lastSecond > 45 && seconds < 15) {
            // Crossed midnight for seconds, add 360 degrees
            this._secondRotation = this._secondRotation - (this._lastSecond * 6) + 360 + targetSecondRotation;
        } else if (seconds !== this._lastSecond || !this._reducedMotion) {
            // Normal update or smooth motion
            const baseDiff = targetSecondRotation - (this._secondRotation % 360);
            if (baseDiff < -180) {
                this._secondRotation += baseDiff + 360;
            } else if (baseDiff > 180) {
                this._secondRotation += baseDiff - 360;
            } else {
                this._secondRotation += baseDiff;
            }
        }

        // Handle wraparound for minutes (59 -> 0)
        if (this._lastMinute > 45 && minutes < 15) {
            this._minuteRotation = this._minuteRotation - (this._lastMinute * 6 + this._lastSecond * 0.1) + 360 + targetMinuteRotation;
        } else {
            const baseDiff = targetMinuteRotation - (this._minuteRotation % 360);
            if (baseDiff < -180) {
                this._minuteRotation += baseDiff + 360;
            } else {
                this._minuteRotation += baseDiff;
            }
        }

        // Handle wraparound for hours (11 -> 0)
        if (this._lastHour === 11 && hours === 0) {
            this._hourRotation = this._hourRotation - (this._lastHour * 30 + this._lastMinute * 0.5) + 360 + targetHourRotation;
        } else {
            const baseDiff = targetHourRotation - (this._hourRotation % 360);
            if (baseDiff < -180) {
                this._hourRotation += baseDiff + 360;
            } else {
                this._hourRotation += baseDiff;
            }
        }

        // Update last values
        this._lastSecond = seconds;
        this._lastMinute = minutes;
        this._lastHour = hours;

        // Apply rotations
        this._secondHand.setAttribute('transform', `rotate(${this._secondRotation}, 50, 50)`);
        this._minuteHand.setAttribute('transform', `rotate(${this._minuteRotation}, 50, 50)`);
        this._hourHand.setAttribute('transform', `rotate(${this._hourRotation}, 50, 50)`);
    }
}

// Register the custom element
customElements.define('analog-clock', AnalogClock);
