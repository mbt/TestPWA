/*
 * Video Player with Chapters Web Component
 * A customizable video player with chapter navigation via dropdown menu.
 * Uses a closed shadow DOM for encapsulation while remaining customizable via CSS custom properties.
 *
 * Usage: <video-player-chapters src="video.mp4"></video-player-chapters>
 *
 * Attributes:
 * - src: URL of the video file (required)
 * - poster: URL of poster image (optional)
 * - chapters: JSON string or comma-separated list of chapters (optional)
 *
 * Chapter Format (JSON):
 * [
 *   {"time": 0, "title": "Introduction"},
 *   {"time": 30, "title": "Main Content"},
 *   {"time": 120, "title": "Conclusion"}
 * ]
 *
 * CSS Custom Properties:
 * --video-player-width: Width of the player (default: 100%)
 * --video-player-max-width: Max width of the player (default: 800px)
 * --video-player-background: Background color (default: #000)
 * --video-player-controls-bg: Controls background (default: rgba(0,0,0,0.7))
 * --video-player-controls-color: Controls text color (default: #fff)
 * --video-player-button-hover: Button hover color (default: rgba(255,255,255,0.2))
 * --video-player-dropdown-bg: Dropdown background (default: rgba(0,0,0,0.9))
 * --video-player-dropdown-hover: Dropdown item hover (default: rgba(255,255,255,0.1))
 */

class VideoPlayerChapters extends HTMLElement {
    constructor() {
        super();

        // Create closed shadow DOM for encapsulation
        this._shadow = this.attachShadow({ mode: 'closed' });

        // State
        this._chapters = [];
        this._currentChapterIndex = 0;
        this._isPlaying = false;
        this._isMuted = false;
        this._volume = 1;
    }

    static get observedAttributes() {
        return ['src', 'poster', 'chapters'];
    }

    connectedCallback() {
        this._render();
        this._setupEventListeners();
        this._parseChapters();
    }

    disconnectedCallback() {
        this._cleanupEventListeners();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this._shadow.firstChild) return;

        switch (name) {
            case 'src':
                if (this._video) {
                    this._video.src = newValue || '';
                }
                break;
            case 'poster':
                if (this._video) {
                    this._video.poster = newValue || '';
                }
                break;
            case 'chapters':
                this._parseChapters();
                break;
        }
    }

    _render() {
        // Add styles to shadow DOM
        const style = document.createElement('style');
        style.textContent = `
            :host {
                display: block;
                width: var(--video-player-width, 100%);
                max-width: var(--video-player-max-width, 800px);
                margin: 0 auto;
                background: var(--video-player-background, #000);
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }

            .video-container {
                position: relative;
                width: 100%;
                background: #000;
            }

            video {
                width: 100%;
                height: auto;
                display: block;
            }

            .controls {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.75rem;
                background: var(--video-player-controls-bg, rgba(0, 0, 0, 0.7));
                color: var(--video-player-controls-color, #fff);
                font-family: system-ui, -apple-system, sans-serif;
                font-size: 0.875rem;
            }

            .control-button {
                background: transparent;
                border: none;
                color: inherit;
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s;
                font-size: 1rem;
            }

            .control-button:hover {
                background: var(--video-player-button-hover, rgba(255, 255, 255, 0.2));
            }

            .control-button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .progress-container {
                flex: 1;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .progress-bar {
                flex: 1;
                height: 6px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 3px;
                cursor: pointer;
                position: relative;
                overflow: hidden;
            }

            .progress-bar:hover {
                height: 8px;
            }

            .progress-filled {
                height: 100%;
                background: var(--video-player-controls-color, #fff);
                border-radius: 3px;
                transition: width 0.1s linear;
            }

            .time-display {
                font-variant-numeric: tabular-nums;
                min-width: 5rem;
                text-align: center;
                font-size: 0.875rem;
            }

            .volume-container {
                display: flex;
                align-items: center;
                gap: 0.25rem;
            }

            .volume-slider {
                width: 60px;
                height: 4px;
                -webkit-appearance: none;
                appearance: none;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 2px;
                outline: none;
                cursor: pointer;
            }

            .volume-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 12px;
                height: 12px;
                background: #fff;
                border-radius: 50%;
                cursor: pointer;
            }

            .volume-slider::-moz-range-thumb {
                width: 12px;
                height: 12px;
                background: #fff;
                border-radius: 50%;
                cursor: pointer;
                border: none;
            }

            .chapter-dropdown {
                position: relative;
            }

            .chapter-button {
                background: transparent;
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: inherit;
                cursor: pointer;
                padding: 0.5rem 0.75rem;
                border-radius: 4px;
                font-size: 0.875rem;
                white-space: nowrap;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .chapter-button:hover {
                background: var(--video-player-button-hover, rgba(255, 255, 255, 0.2));
                border-color: rgba(255, 255, 255, 0.5);
            }

            .chapter-menu {
                position: absolute;
                bottom: 100%;
                right: 0;
                margin-bottom: 0.5rem;
                background: var(--video-player-dropdown-bg, rgba(0, 0, 0, 0.95));
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 4px;
                min-width: 200px;
                max-height: 300px;
                overflow-y: auto;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
                z-index: 1000;
                display: none;
            }

            .chapter-menu.open {
                display: block;
            }

            .chapter-item {
                padding: 0.75rem 1rem;
                cursor: pointer;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                transition: background 0.2s;
            }

            .chapter-item:last-child {
                border-bottom: none;
            }

            .chapter-item:hover {
                background: var(--video-player-dropdown-hover, rgba(255, 255, 255, 0.1));
            }

            .chapter-item.active {
                background: var(--video-player-dropdown-hover, rgba(255, 255, 255, 0.15));
                font-weight: bold;
            }

            .chapter-title {
                display: block;
                font-size: 0.875rem;
                margin-bottom: 0.25rem;
            }

            .chapter-time {
                display: block;
                font-size: 0.75rem;
                opacity: 0.7;
            }

            @media (max-width: 600px) {
                .controls {
                    flex-wrap: wrap;
                    gap: 0.25rem;
                }

                .progress-container {
                    flex-basis: 100%;
                    order: -1;
                }

                .volume-container {
                    display: none;
                }
            }
        `;
        this._shadow.appendChild(style);

        // Create video container
        const container = document.createElement('div');
        container.className = 'video-container';

        // Create video element
        this._video = document.createElement('video');
        this._video.setAttribute('playsinline', '');
        if (this.hasAttribute('src')) {
            this._video.src = this.getAttribute('src');
        }
        if (this.hasAttribute('poster')) {
            this._video.poster = this.getAttribute('poster');
        }
        container.appendChild(this._video);

        // Create controls
        const controls = document.createElement('div');
        controls.className = 'controls';

        // Play/Pause button
        this._playButton = document.createElement('button');
        this._playButton.className = 'control-button';
        this._playButton.innerHTML = '▶';
        this._playButton.setAttribute('aria-label', 'Play');
        controls.appendChild(this._playButton);

        // Progress container
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';

        // Time display
        this._timeDisplay = document.createElement('div');
        this._timeDisplay.className = 'time-display';
        this._timeDisplay.textContent = '0:00 / 0:00';
        progressContainer.appendChild(this._timeDisplay);

        // Progress bar
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        this._progressFilled = document.createElement('div');
        this._progressFilled.className = 'progress-filled';
        this._progressFilled.style.width = '0%';
        progressBar.appendChild(this._progressFilled);
        this._progressBar = progressBar;
        progressContainer.appendChild(progressBar);

        controls.appendChild(progressContainer);

        // Volume controls
        const volumeContainer = document.createElement('div');
        volumeContainer.className = 'volume-container';

        this._muteButton = document.createElement('button');
        this._muteButton.className = 'control-button';
        this._muteButton.innerHTML = '🔊';
        this._muteButton.setAttribute('aria-label', 'Mute');
        volumeContainer.appendChild(this._muteButton);

        this._volumeSlider = document.createElement('input');
        this._volumeSlider.type = 'range';
        this._volumeSlider.className = 'volume-slider';
        this._volumeSlider.min = '0';
        this._volumeSlider.max = '1';
        this._volumeSlider.step = '0.1';
        this._volumeSlider.value = '1';
        volumeContainer.appendChild(this._volumeSlider);

        controls.appendChild(volumeContainer);

        // Chapter dropdown
        const chapterDropdown = document.createElement('div');
        chapterDropdown.className = 'chapter-dropdown';

        this._chapterButton = document.createElement('button');
        this._chapterButton.className = 'chapter-button';
        this._chapterButton.innerHTML = '📑 Chapters';
        this._chapterButton.setAttribute('aria-label', 'Select chapter');
        chapterDropdown.appendChild(this._chapterButton);

        this._chapterMenu = document.createElement('div');
        this._chapterMenu.className = 'chapter-menu';
        chapterDropdown.appendChild(this._chapterMenu);

        controls.appendChild(chapterDropdown);

        container.appendChild(controls);
        this._shadow.appendChild(container);
    }

    _setupEventListeners() {
        // Play/Pause
        this._playButton.addEventListener('click', () => this._togglePlay());
        this._video.addEventListener('click', () => this._togglePlay());

        // Video events
        this._video.addEventListener('play', () => this._onPlay());
        this._video.addEventListener('pause', () => this._onPause());
        this._video.addEventListener('timeupdate', () => this._onTimeUpdate());
        this._video.addEventListener('loadedmetadata', () => this._onMetadataLoaded());
        this._video.addEventListener('ended', () => this._onEnded());

        // Progress bar
        this._progressBar.addEventListener('click', (e) => this._seek(e));

        // Volume
        this._muteButton.addEventListener('click', () => this._toggleMute());
        this._volumeSlider.addEventListener('input', (e) => this._setVolume(e.target.value));

        // Chapter dropdown
        this._chapterButton.addEventListener('click', () => this._toggleChapterMenu());

        // Close chapter menu when clicking outside
        this._shadow.addEventListener('click', (e) => {
            if (!e.target.closest('.chapter-dropdown')) {
                this._closeChapterMenu();
            }
        });

        // Keyboard shortcuts
        this._video.addEventListener('keydown', (e) => this._handleKeyboard(e));
    }

    _cleanupEventListeners() {
        // Event listeners are automatically cleaned up when the element is removed
    }

    _parseChapters() {
        const chaptersAttr = this.getAttribute('chapters');
        if (!chaptersAttr) {
            this._chapters = [];
            this._renderChapterMenu();
            return;
        }

        try {
            // Try parsing as JSON first
            this._chapters = JSON.parse(chaptersAttr);
        } catch (e) {
            // If not JSON, assume it's comma-separated format: "0:Intro,30:Main,120:End"
            this._chapters = chaptersAttr.split(',').map(item => {
                const [time, title] = item.split(':');
                return {
                    time: parseFloat(time),
                    title: title || `Chapter ${this._chapters.length + 1}`
                };
            });
        }

        // Sort chapters by time
        this._chapters.sort((a, b) => a.time - b.time);
        this._renderChapterMenu();
    }

    _renderChapterMenu() {
        this._chapterMenu.innerHTML = '';

        if (this._chapters.length === 0) {
            const item = document.createElement('div');
            item.className = 'chapter-item';
            item.innerHTML = '<span class="chapter-title">No chapters available</span>';
            this._chapterMenu.appendChild(item);
            return;
        }

        this._chapters.forEach((chapter, index) => {
            const item = document.createElement('div');
            item.className = 'chapter-item';
            item.innerHTML = `
                <span class="chapter-title">${chapter.title}</span>
                <span class="chapter-time">${this._formatTime(chapter.time)}</span>
            `;
            item.addEventListener('click', () => this._seekToChapter(index));
            this._chapterMenu.appendChild(item);
        });
    }

    _togglePlay() {
        if (this._video.paused) {
            this._video.play();
        } else {
            this._video.pause();
        }
    }

    _onPlay() {
        this._isPlaying = true;
        this._playButton.innerHTML = '⏸';
        this._playButton.setAttribute('aria-label', 'Pause');
    }

    _onPause() {
        this._isPlaying = false;
        this._playButton.innerHTML = '▶';
        this._playButton.setAttribute('aria-label', 'Play');
    }

    _onTimeUpdate() {
        const percent = (this._video.currentTime / this._video.duration) * 100 || 0;
        this._progressFilled.style.width = `${percent}%`;

        const current = this._formatTime(this._video.currentTime);
        const duration = this._formatTime(this._video.duration);
        this._timeDisplay.textContent = `${current} / ${duration}`;

        // Update current chapter
        this._updateCurrentChapter();
    }

    _onMetadataLoaded() {
        const duration = this._formatTime(this._video.duration);
        this._timeDisplay.textContent = `0:00 / ${duration}`;
    }

    _onEnded() {
        this._playButton.innerHTML = '▶';
        this._playButton.setAttribute('aria-label', 'Play');
    }

    _seek(e) {
        const rect = this._progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        this._video.currentTime = percent * this._video.duration;
    }

    _toggleMute() {
        this._video.muted = !this._video.muted;
        this._isMuted = this._video.muted;
        this._muteButton.innerHTML = this._isMuted ? '🔇' : '🔊';
        this._muteButton.setAttribute('aria-label', this._isMuted ? 'Unmute' : 'Mute');
    }

    _setVolume(value) {
        this._video.volume = value;
        this._volume = value;

        if (value == 0) {
            this._muteButton.innerHTML = '🔇';
        } else if (value < 0.5) {
            this._muteButton.innerHTML = '🔉';
        } else {
            this._muteButton.innerHTML = '🔊';
        }
    }

    _toggleChapterMenu() {
        this._chapterMenu.classList.toggle('open');
    }

    _closeChapterMenu() {
        this._chapterMenu.classList.remove('open');
    }

    _seekToChapter(index) {
        if (index >= 0 && index < this._chapters.length) {
            this._video.currentTime = this._chapters[index].time;
            this._currentChapterIndex = index;
            this._closeChapterMenu();

            if (this._video.paused) {
                this._video.play();
            }
        }
    }

    _updateCurrentChapter() {
        if (this._chapters.length === 0) return;

        const currentTime = this._video.currentTime;

        // Find the current chapter
        for (let i = this._chapters.length - 1; i >= 0; i--) {
            if (currentTime >= this._chapters[i].time) {
                if (this._currentChapterIndex !== i) {
                    this._currentChapterIndex = i;
                    this._updateChapterMenuHighlight();
                }
                break;
            }
        }
    }

    _updateChapterMenuHighlight() {
        const items = this._chapterMenu.querySelectorAll('.chapter-item');
        items.forEach((item, index) => {
            if (index === this._currentChapterIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    _formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';

        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);

        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    _handleKeyboard(e) {
        switch (e.key) {
            case ' ':
            case 'k':
                e.preventDefault();
                this._togglePlay();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this._video.currentTime -= 5;
                break;
            case 'ArrowRight':
                e.preventDefault();
                this._video.currentTime += 5;
                break;
            case 'm':
                e.preventDefault();
                this._toggleMute();
                break;
        }
    }

    // Public API
    play() {
        this._video.play();
    }

    pause() {
        this._video.pause();
    }

    seekToTime(seconds) {
        this._video.currentTime = seconds;
    }

    setChapters(chapters) {
        this._chapters = chapters;
        this._chapters.sort((a, b) => a.time - b.time);
        this._renderChapterMenu();
    }
}

// Register the custom element
customElements.define('video-player-chapters', VideoPlayerChapters);
