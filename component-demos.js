/*
 * Component Demos Module
 * Provides comprehensive demos and documentation for each Web Component.
 */

const ComponentDemos = (function() {
    // Helper to create a code block
    const createCodeBlock = (code, language = 'html') => {
        const pre = document.createElement('pre');
        pre.className = 'code-block';
        const codeEl = document.createElement('code');
        codeEl.className = `language-${language}`;
        codeEl.textContent = code.trim();
        pre.appendChild(codeEl);
        return pre;
    };

    // Helper to create a section
    const createSection = (title, content) => {
        const section = document.createElement('section');
        section.className = 'demo-section';

        const heading = document.createElement('h2');
        heading.textContent = title;
        section.appendChild(heading);

        if (typeof content === 'string') {
            const p = document.createElement('p');
            p.textContent = content;
            section.appendChild(p);
        } else if (Array.isArray(content)) {
            content.forEach(el => section.appendChild(el));
        } else {
            section.appendChild(content);
        }

        return section;
    };

    // Helper to create a demo container
    const createDemoContainer = (element, description = '') => {
        const container = document.createElement('div');
        container.className = 'demo-container';

        if (description) {
            const desc = document.createElement('p');
            desc.className = 'demo-description';
            desc.textContent = description;
            container.appendChild(desc);
        }

        const demoBox = document.createElement('div');
        demoBox.className = 'demo-box';
        demoBox.appendChild(element);
        container.appendChild(demoBox);

        return container;
    };

    // Helper to create a property table
    const createPropertyTable = (properties) => {
        const table = document.createElement('table');
        table.className = 'property-table';

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        ['Property', 'Type', 'Default', 'Description'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        properties.forEach(prop => {
            const row = document.createElement('tr');

            const propCell = document.createElement('td');
            const code = document.createElement('code');
            code.textContent = prop.name;
            propCell.appendChild(code);
            row.appendChild(propCell);

            const typeCell = document.createElement('td');
            typeCell.textContent = prop.type;
            row.appendChild(typeCell);

            const defaultCell = document.createElement('td');
            defaultCell.textContent = prop.default;
            row.appendChild(defaultCell);

            const descCell = document.createElement('td');
            descCell.textContent = prop.description;
            row.appendChild(descCell);

            tbody.appendChild(row);
        });
        table.appendChild(tbody);

        return table;
    };

    // Analog Clock Demo
    const getAnalogClockDemo = () => {
        const container = document.createElement('div');
        container.className = 'component-documentation';

        // Basic Usage
        const basicUsage = createSection('Basic Usage', [
            createDemoContainer(
                document.createElement('analog-clock'),
                'Default analog clock'
            ),
            createCodeBlock('<analog-clock></analog-clock>')
        ]);
        container.appendChild(basicUsage);

        // Customization
        const customSection = createSection('Customization', []);

        const customClock = document.createElement('analog-clock');
        customClock.style.setProperty('--analog-clock-size', '300px');
        customClock.style.setProperty('--analog-clock-face-color', '#f0f0f0');
        customClock.style.setProperty('--analog-clock-border-color', '#501464');
        customClock.style.setProperty('--analog-clock-border-width', '4px');
        customClock.style.setProperty('--analog-clock-hand-color', '#501464');
        customClock.style.setProperty('--analog-clock-second-hand-color', '#ff3366');

        customSection.appendChild(createDemoContainer(customClock, 'Customized with CSS custom properties'));
        customSection.appendChild(createCodeBlock(
`<analog-clock style="
    --analog-clock-size: 300px;
    --analog-clock-face-color: #f0f0f0;
    --analog-clock-border-color: #501464;
    --analog-clock-border-width: 4px;
    --analog-clock-hand-color: #501464;
    --analog-clock-second-hand-color: #ff3366;
"></analog-clock>`
        ));
        container.appendChild(customSection);

        // CSS Custom Properties
        const propsSection = createSection('CSS Custom Properties', [
            createPropertyTable([
                {
                    name: '--analog-clock-size',
                    type: 'length',
                    default: '200px',
                    description: 'Size of the clock'
                },
                {
                    name: '--analog-clock-face-color',
                    type: 'color',
                    default: 'varies',
                    description: 'Background color of clock face'
                },
                {
                    name: '--analog-clock-border-color',
                    type: 'color',
                    default: 'varies',
                    description: 'Border color of clock'
                },
                {
                    name: '--analog-clock-border-width',
                    type: 'length',
                    default: '2px',
                    description: 'Border width'
                },
                {
                    name: '--analog-clock-hand-color',
                    type: 'color',
                    default: 'varies',
                    description: 'Color of hour and minute hands'
                },
                {
                    name: '--analog-clock-second-hand-color',
                    type: 'color',
                    default: 'varies',
                    description: 'Color of second hand'
                },
                {
                    name: '--analog-clock-tick-color',
                    type: 'color',
                    default: 'varies',
                    description: 'Color of hour markers'
                },
                {
                    name: '--analog-clock-center-color',
                    type: 'color',
                    default: 'varies',
                    description: 'Color of center dot'
                }
            ])
        ]);
        container.appendChild(propsSection);

        // Features
        const featuresSection = createSection('Features', []);
        const featuresList = document.createElement('ul');
        featuresList.className = 'feature-list';
        [
            'Smooth animated clock hands',
            'Respects prefers-reduced-motion for accessibility',
            'Fully customizable with CSS custom properties',
            'Closed Shadow DOM for style encapsulation',
            'Responsive to theme changes'
        ].forEach(feature => {
            const li = document.createElement('li');
            li.textContent = feature;
            featuresList.appendChild(li);
        });
        featuresSection.appendChild(featuresList);
        container.appendChild(featuresSection);

        return container;
    };

    // Digital Clock Demo
    const getDigitalClockDemo = () => {
        const container = document.createElement('div');
        container.className = 'component-documentation';

        // Basic Usage
        const basicUsage = createSection('Basic Usage', [
            createDemoContainer(
                document.createElement('digital-clock'),
                'Default digital clock (24-hour format)'
            ),
            createCodeBlock('<digital-clock></digital-clock>')
        ]);
        container.appendChild(basicUsage);

        // 12-hour format
        const format12Section = createSection('12-Hour Format', []);
        const clock12 = document.createElement('digital-clock');
        clock12.setAttribute('format', '12');
        format12Section.appendChild(createDemoContainer(clock12, '12-hour format with AM/PM'));
        format12Section.appendChild(createCodeBlock('<digital-clock format="12"></digital-clock>'));
        container.appendChild(format12Section);

        // With date
        const dateSection = createSection('With Date Display', []);
        const clockWithDate = document.createElement('digital-clock');
        clockWithDate.setAttribute('show-date', 'true');
        dateSection.appendChild(createDemoContainer(clockWithDate, 'Shows current date below time'));
        dateSection.appendChild(createCodeBlock('<digital-clock show-date="true"></digital-clock>'));
        container.appendChild(dateSection);

        // Without seconds
        const noSecondsSection = createSection('Hide Seconds', []);
        const clockNoSeconds = document.createElement('digital-clock');
        clockNoSeconds.setAttribute('show-seconds', 'false');
        noSecondsSection.appendChild(createDemoContainer(clockNoSeconds, 'Hours and minutes only'));
        noSecondsSection.appendChild(createCodeBlock('<digital-clock show-seconds="false"></digital-clock>'));
        container.appendChild(noSecondsSection);

        // Blink Rate Variations
        const blinkRateSection = createSection('Blink Rate Variations', []);

        const clockSlow = document.createElement('digital-clock');
        clockSlow.setAttribute('blink-rate', '0.25');
        blinkRateSection.appendChild(createDemoContainer(clockSlow, 'Slow blink: 0.25 Hz (blinks every 4 seconds)'));
        blinkRateSection.appendChild(createCodeBlock('<digital-clock blink-rate="0.25"></digital-clock>'));

        const clockFast = document.createElement('digital-clock');
        clockFast.setAttribute('blink-rate', '4');
        blinkRateSection.appendChild(createDemoContainer(clockFast, 'Fast blink: 4 Hz (blinks 4 times per second)'));
        blinkRateSection.appendChild(createCodeBlock('<digital-clock blink-rate="4"></digital-clock>'));

        container.appendChild(blinkRateSection);

        // Complete example with date
        const completeSection = createSection('Complete Example', []);
        const clockComplete = document.createElement('digital-clock');
        clockComplete.setAttribute('format', '12');
        clockComplete.setAttribute('show-date', 'true');
        completeSection.appendChild(createDemoContainer(clockComplete, '12-hour format with date display'));
        completeSection.appendChild(createCodeBlock(
`<digital-clock
    format="12"
    show-date="true">
</digital-clock>`
        ));
        container.appendChild(completeSection);

        // Customization
        const customSection = createSection('Customization', []);
        const customClock = document.createElement('digital-clock');
        customClock.setAttribute('format', '12');
        customClock.setAttribute('show-date', 'true');
        customClock.style.setProperty('--digital-clock-font-size', '4rem');
        customClock.style.setProperty('--digital-clock-text-color', '#c084fc');
        customClock.style.setProperty('--digital-clock-background-color', 'rgba(126, 34, 206, 0.15)');
        customClock.style.setProperty('--digital-clock-border-color', '#a855f7');
        customClock.style.setProperty('--digital-clock-border-width', '3px');

        customSection.appendChild(createDemoContainer(customClock, 'Fully customized with CSS - high contrast purple theme'));
        customSection.appendChild(createCodeBlock(
`<digital-clock
    format="12"
    show-date="true"
    style="
        --digital-clock-font-size: 4rem;
        --digital-clock-text-color: #c084fc;
        --digital-clock-background-color: rgba(126, 34, 206, 0.15);
        --digital-clock-border-color: #a855f7;
        --digital-clock-border-width: 3px;
    ">
</digital-clock>`
        ));
        container.appendChild(customSection);

        // Attributes
        const attributesSection = createSection('Attributes', [
            createPropertyTable([
                {
                    name: 'format',
                    type: '"12" | "24"',
                    default: '"24"',
                    description: 'Time format (12-hour with AM/PM or 24-hour)'
                },
                {
                    name: 'show-seconds',
                    type: 'boolean',
                    default: 'true',
                    description: 'Whether to display seconds'
                },
                {
                    name: 'show-date',
                    type: 'boolean',
                    default: 'false',
                    description: 'Whether to display the date'
                },
                {
                    name: 'blink-separator',
                    type: 'boolean',
                    default: 'true',
                    description: 'Whether the time separator blinks every second'
                },
                {
                    name: 'blink-rate',
                    type: 'number',
                    default: '1',
                    description: 'Blink frequency in Hz (times per second). For example: 0.25 = every 4 seconds, 1 = once per second, 2 = twice per second, 4 = four times per second'
                }
            ])
        ]);
        container.appendChild(attributesSection);

        // CSS Custom Properties
        const propsSection = createSection('CSS Custom Properties', [
            createPropertyTable([
                {
                    name: '--digital-clock-font-family',
                    type: 'font-family',
                    default: "'American Typewriter', 'Courier New', monospace stack",
                    description: 'Font family for the clock'
                },
                {
                    name: '--digital-clock-font-size',
                    type: 'length',
                    default: '3rem',
                    description: 'Font size for time display'
                },
                {
                    name: '--digital-clock-date-font-size',
                    type: 'length',
                    default: '1rem',
                    description: 'Font size for date display'
                },
                {
                    name: '--digital-clock-text-color',
                    type: 'color',
                    default: 'currentColor',
                    description: 'Color of text'
                },
                {
                    name: '--digital-clock-background-color',
                    type: 'color',
                    default: 'transparent',
                    description: 'Background color'
                },
                {
                    name: '--digital-clock-border-color',
                    type: 'color',
                    default: 'currentColor',
                    description: 'Border color'
                },
                {
                    name: '--digital-clock-border-width',
                    type: 'length',
                    default: '1px',
                    description: 'Border width'
                },
                {
                    name: '--digital-clock-border-radius',
                    type: 'length',
                    default: '8px',
                    description: 'Border radius'
                },
                {
                    name: '--digital-clock-padding',
                    type: 'length',
                    default: '1rem',
                    description: 'Padding inside clock'
                },
                {
                    name: '--digital-clock-separator-color',
                    type: 'color',
                    default: 'same as text',
                    description: 'Color of time separator (:)'
                }
            ])
        ]);
        container.appendChild(propsSection);

        // Features
        const featuresSection = createSection('Features', []);
        const featuresList = document.createElement('ul');
        featuresList.className = 'feature-list';
        [
            'Supports both 12-hour and 24-hour formats',
            'Optional date display with full localization',
            'Optional seconds display',
            'Blinking separator animation',
            'Fully customizable with CSS custom properties',
            'Closed Shadow DOM for style encapsulation',
            'Responsive to theme changes',
            'Accessible and semantic'
        ].forEach(feature => {
            const li = document.createElement('li');
            li.textContent = feature;
            featuresList.appendChild(li);
        });
        featuresSection.appendChild(featuresList);
        container.appendChild(featuresSection);

        return container;
    };

    // Video Player with Chapters Demo
    const getVideoPlayerChaptersDemo = () => {
        const container = document.createElement('div');
        container.className = 'component-documentation';

        // Basic Usage
        const basicUsage = createSection('Basic Usage', []);
        const desc = document.createElement('p');
        desc.innerHTML = 'A video player with chapter navigation. You can provide a video source and chapters for quick seeking.';
        basicUsage.appendChild(desc);

        const player1 = document.createElement('video-player-chapters');
        player1.setAttribute('src', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
        player1.setAttribute('poster', 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="450"%3E%3Crect fill="%23333" width="800" height="450"/%3E%3Ctext fill="%23fff" font-family="sans-serif" font-size="48" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EBig Buck Bunny%3C/text%3E%3C/svg%3E');
        const chapters = [
            {time: 0, title: "Opening Scene"},
            {time: 30, title: "Meet Big Buck"},
            {time: 60, title: "The Forest"},
            {time: 120, title: "Adventures Begin"},
            {time: 180, title: "Action Sequence"},
            {time: 240, title: "Resolution"},
            {time: 480, title: "Credits"}
        ];
        player1.setAttribute('chapters', JSON.stringify(chapters));

        basicUsage.appendChild(createDemoContainer(player1, 'Video player with Big Buck Bunny sample video and chapters'));
        basicUsage.appendChild(createCodeBlock(
`<video-player-chapters
    src="video.mp4"
    poster="poster.jpg"
    chapters='[
        {"time": 0, "title": "Opening Scene"},
        {"time": 30, "title": "Meet Big Buck"},
        {"time": 60, "title": "The Forest"}
    ]'>
</video-player-chapters>`
        ));
        container.appendChild(basicUsage);

        // Simple format
        const simpleFormat = createSection('Simple Chapter Format', []);
        const player2 = document.createElement('video-player-chapters');
        player2.setAttribute('src', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4');
        player2.setAttribute('chapters', '0:Introduction,30:The Dream Begins,120:In the Dream,300:Awakening,480:Conclusion');

        simpleFormat.appendChild(createDemoContainer(player2, 'Using simple comma-separated chapter format'));
        simpleFormat.appendChild(createCodeBlock(
`<video-player-chapters
    src="video.mp4"
    chapters="0:Introduction,30:Main Content,120:Conclusion">
</video-player-chapters>`
        ));
        container.appendChild(simpleFormat);

        // Customization
        const customSection = createSection('Customization', []);
        const customPlayer = document.createElement('video-player-chapters');
        customPlayer.setAttribute('src', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
        customPlayer.style.setProperty('--video-player-max-width', '600px');
        customPlayer.style.setProperty('--video-player-controls-bg', 'rgba(80, 20, 100, 0.9)');
        customPlayer.style.setProperty('--video-player-controls-color', '#f0e6ff');
        customPlayer.style.setProperty('--video-player-button-hover', 'rgba(160, 80, 200, 0.3)');
        customPlayer.style.setProperty('--video-player-dropdown-bg', 'rgba(80, 20, 100, 0.95)');
        customPlayer.setAttribute('chapters', '0:Start,10:Middle,20:End');

        customSection.appendChild(createDemoContainer(customPlayer, 'Custom purple theme'));
        customSection.appendChild(createCodeBlock(
`<video-player-chapters
    src="video.mp4"
    chapters="0:Start,10:Middle,20:End"
    style="
        --video-player-max-width: 600px;
        --video-player-controls-bg: rgba(80, 20, 100, 0.9);
        --video-player-controls-color: #f0e6ff;
        --video-player-button-hover: rgba(160, 80, 200, 0.3);
        --video-player-dropdown-bg: rgba(80, 20, 100, 0.95);
    ">
</video-player-chapters>`
        ));
        container.appendChild(customSection);

        // Attributes
        const attributesSection = createSection('Attributes', [
            createPropertyTable([
                {
                    name: 'src',
                    type: 'string',
                    default: 'required',
                    description: 'URL of the video file'
                },
                {
                    name: 'poster',
                    type: 'string',
                    default: 'optional',
                    description: 'URL of poster image displayed before playback'
                },
                {
                    name: 'chapters',
                    type: 'JSON | string',
                    default: 'optional',
                    description: 'Chapter data as JSON array or comma-separated string'
                }
            ])
        ]);
        container.appendChild(attributesSection);

        // CSS Custom Properties
        const propsSection = createSection('CSS Custom Properties', [
            createPropertyTable([
                {
                    name: '--video-player-width',
                    type: 'length',
                    default: '100%',
                    description: 'Width of the player'
                },
                {
                    name: '--video-player-max-width',
                    type: 'length',
                    default: '800px',
                    description: 'Maximum width of the player'
                },
                {
                    name: '--video-player-background',
                    type: 'color',
                    default: '#000',
                    description: 'Background color of player'
                },
                {
                    name: '--video-player-controls-bg',
                    type: 'color',
                    default: 'rgba(0,0,0,0.7)',
                    description: 'Controls background color'
                },
                {
                    name: '--video-player-controls-color',
                    type: 'color',
                    default: '#fff',
                    description: 'Controls text color'
                },
                {
                    name: '--video-player-button-hover',
                    type: 'color',
                    default: 'rgba(255,255,255,0.2)',
                    description: 'Button hover background'
                },
                {
                    name: '--video-player-dropdown-bg',
                    type: 'color',
                    default: 'rgba(0,0,0,0.9)',
                    description: 'Chapter dropdown background'
                },
                {
                    name: '--video-player-dropdown-hover',
                    type: 'color',
                    default: 'rgba(255,255,255,0.1)',
                    description: 'Chapter item hover background'
                }
            ])
        ]);
        container.appendChild(propsSection);

        // Features
        const featuresSection = createSection('Features', []);
        const featuresList = document.createElement('ul');
        featuresList.className = 'feature-list';
        [
            'Custom video controls with play/pause, seek, and volume',
            'Chapter navigation via dropdown menu',
            'Progress bar with click-to-seek',
            'Time display showing current time and duration',
            'Automatic chapter tracking during playback',
            'Keyboard shortcuts (Space/K: play/pause, Arrow keys: seek, M: mute)',
            'Fully customizable with CSS custom properties',
            'Responsive design with mobile support',
            'Closed Shadow DOM for style encapsulation',
            'Supports both JSON and simple string chapter formats'
        ].forEach(feature => {
            const li = document.createElement('li');
            li.textContent = feature;
            featuresList.appendChild(li);
        });
        featuresSection.appendChild(featuresList);
        container.appendChild(featuresSection);

        // API Methods
        const apiSection = createSection('JavaScript API', []);
        const apiList = document.createElement('ul');
        apiList.className = 'feature-list';
        [
            'play() - Start video playback',
            'pause() - Pause video playback',
            'seekToTime(seconds) - Seek to specific time',
            'setChapters(chapters) - Update chapters dynamically'
        ].forEach(method => {
            const li = document.createElement('li');
            const code = document.createElement('code');
            code.textContent = method;
            li.appendChild(code);
            apiList.appendChild(li);
        });
        apiSection.appendChild(apiList);
        apiSection.appendChild(createCodeBlock(
`const player = document.querySelector('video-player-chapters');
player.play();
player.seekToTime(30);
player.setChapters([
    {time: 0, title: "New Chapter 1"},
    {time: 60, title: "New Chapter 2"}
]);`, 'javascript'
        ));
        container.appendChild(apiSection);

        return container;
    };

    // Public API - returns demo content for a given component ID
    const getDemoContent = (componentId) => {
        switch (componentId) {
            case 'analog-clock':
                return getAnalogClockDemo();
            case 'digital-clock':
                return getDigitalClockDemo();
            case 'video-player-chapters':
                return getVideoPlayerChaptersDemo();
            default:
                const placeholder = document.createElement('p');
                placeholder.textContent = 'Component demo coming soon...';
                return placeholder;
        }
    };

    return {
        getDemoContent
    };
})();

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComponentDemos;
}
