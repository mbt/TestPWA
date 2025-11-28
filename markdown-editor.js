// Markdown Editor Web Component with Image Upload
class MarkdownEditor extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.attachEventListeners();
    }

    static get observedAttributes() {
        return ['placeholder', 'value'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'value' && this.textarea) {
            this.textarea.value = newValue || '';
        }
        if (name === 'placeholder' && this.textarea) {
            this.textarea.placeholder = newValue || 'Enter markdown text...';
        }
    }

    get value() {
        return this.textarea ? this.textarea.value : '';
    }

    set value(val) {
        if (this.textarea) {
            this.textarea.value = val || '';
        }
    }

    render() {
        const placeholder = this.getAttribute('placeholder') || 'Enter markdown text...';
        const value = this.getAttribute('value') || '';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                }

                .editor-container {
                    border: 1px solid var(--border-color, #444);
                    border-radius: 8px;
                    overflow: hidden;
                    background: var(--bg-secondary, rgb(30, 30, 30));
                }

                .toolbar {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 4px;
                    padding: 8px;
                    background: var(--bg-tertiary, rgb(25, 25, 25));
                    border-bottom: 1px solid var(--border-color, #444);
                }

                .toolbar-button {
                    padding: 6px 12px;
                    background: var(--bg-secondary, rgb(30, 30, 30));
                    border: 1px solid var(--border-color, #444);
                    border-radius: 4px;
                    color: var(--text-primary, rgb(240, 240, 240));
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s;
                }

                .toolbar-button:hover {
                    background: var(--accent-primary, rgb(80, 20, 100));
                    border-color: var(--accent-primary, rgb(80, 20, 100));
                }

                .toolbar-button:active {
                    transform: scale(0.95);
                }

                .toolbar-separator {
                    width: 1px;
                    background: var(--border-color, #444);
                    margin: 0 4px;
                }

                textarea {
                    width: 100%;
                    min-height: 200px;
                    padding: 12px;
                    background: var(--bg-secondary, rgb(30, 30, 30));
                    color: var(--text-primary, rgb(240, 240, 240));
                    border: none;
                    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                    font-size: 14px;
                    line-height: 1.6;
                    resize: vertical;
                    outline: none;
                }

                textarea::placeholder {
                    color: var(--text-secondary, rgb(160, 160, 160));
                }

                .preview-container {
                    padding: 12px;
                    border-top: 1px solid var(--border-color, #444);
                    background: var(--bg-secondary, rgb(30, 30, 30));
                    min-height: 100px;
                    color: var(--text-primary, rgb(240, 240, 240));
                    font-family: system-ui, -apple-system, sans-serif;
                    line-height: 1.6;
                }

                .preview-container h1,
                .preview-container h2,
                .preview-container h3 {
                    margin-top: 1em;
                    margin-bottom: 0.5em;
                    color: var(--accent-primary, rgb(80, 20, 100));
                }

                .preview-container img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 4px;
                    margin: 8px 0;
                }

                .preview-container code {
                    background: var(--bg-tertiary, rgb(25, 25, 25));
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                }

                .preview-container pre {
                    background: var(--bg-tertiary, rgb(25, 25, 25));
                    padding: 12px;
                    border-radius: 4px;
                    overflow-x: auto;
                }

                .preview-container pre code {
                    background: none;
                    padding: 0;
                }

                .preview-container blockquote {
                    border-left: 4px solid var(--accent-primary, rgb(80, 20, 100));
                    margin: 1em 0;
                    padding-left: 1em;
                    color: var(--text-secondary, rgb(160, 160, 160));
                }

                input[type="file"] {
                    display: none;
                }

                .tab-container {
                    display: flex;
                    gap: 4px;
                    padding: 8px 8px 0 8px;
                    background: var(--bg-tertiary, rgb(25, 25, 25));
                }

                .tab {
                    padding: 8px 16px;
                    background: var(--bg-secondary, rgb(30, 30, 30));
                    border: 1px solid var(--border-color, #444);
                    border-bottom: none;
                    border-radius: 4px 4px 0 0;
                    color: var(--text-secondary, rgb(160, 160, 160));
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .tab.active {
                    background: var(--bg-secondary, rgb(30, 30, 30));
                    color: var(--text-primary, rgb(240, 240, 240));
                    border-color: var(--border-color, #444);
                }

                .tab:hover:not(.active) {
                    color: var(--text-primary, rgb(240, 240, 240));
                }

                .content-area {
                    display: none;
                }

                .content-area.active {
                    display: block;
                }
            </style>

            <div class="editor-container">
                <div class="tab-container">
                    <div class="tab active" data-tab="edit">Edit</div>
                    <div class="tab" data-tab="preview">Preview</div>
                </div>

                <div class="toolbar">
                    <button class="toolbar-button" data-action="bold" title="Bold">
                        <strong>B</strong>
                    </button>
                    <button class="toolbar-button" data-action="italic" title="Italic">
                        <em>I</em>
                    </button>
                    <button class="toolbar-button" data-action="heading" title="Heading">
                        H
                    </button>
                    <div class="toolbar-separator"></div>
                    <button class="toolbar-button" data-action="link" title="Link">
                        🔗
                    </button>
                    <button class="toolbar-button" data-action="image" title="Upload Image">
                        🖼️
                    </button>
                    <div class="toolbar-separator"></div>
                    <button class="toolbar-button" data-action="list" title="Bullet List">
                        •
                    </button>
                    <button class="toolbar-button" data-action="numbered" title="Numbered List">
                        1.
                    </button>
                    <button class="toolbar-button" data-action="quote" title="Quote">
                        "
                    </button>
                    <button class="toolbar-button" data-action="code" title="Code">
                        &lt;/&gt;
                    </button>
                </div>

                <div class="content-area active" data-content="edit">
                    <textarea placeholder="${placeholder}">${value}</textarea>
                </div>

                <div class="content-area" data-content="preview">
                    <div class="preview-container"></div>
                </div>

                <input type="file" accept="image/*" />
            </div>
        `;

        this.textarea = this.shadowRoot.querySelector('textarea');
        this.fileInput = this.shadowRoot.querySelector('input[type="file"]');
        this.previewContainer = this.shadowRoot.querySelector('.preview-container');
    }

    attachEventListeners() {
        // Toolbar buttons
        this.shadowRoot.querySelectorAll('.toolbar-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.currentTarget.getAttribute('data-action');
                this.handleToolbarAction(action);
            });
        });

        // Tab switching
        this.shadowRoot.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.currentTarget.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });

        // File input
        this.fileInput.addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });

        // Update preview on input
        this.textarea.addEventListener('input', () => {
            this.dispatchEvent(new CustomEvent('input', {
                detail: { value: this.textarea.value }
            }));
        });
    }

    switchTab(tabName) {
        // Update tab active state
        this.shadowRoot.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
        });

        // Update content area
        this.shadowRoot.querySelectorAll('.content-area').forEach(area => {
            area.classList.toggle('active', area.getAttribute('data-content') === tabName);
        });

        // Update preview if switching to preview tab
        if (tabName === 'preview') {
            this.updatePreview();
        }
    }

    updatePreview() {
        const markdown = this.textarea.value;
        this.previewContainer.innerHTML = this.parseMarkdown(markdown);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    isSafeUrl(url) {
        if (!url) return false;
        const trimmed = url.trim().toLowerCase();
        // Allow http, https, mailto, data (for images), and relative URLs
        return trimmed.startsWith('http://') ||
               trimmed.startsWith('https://') ||
               trimmed.startsWith('mailto:') ||
               trimmed.startsWith('data:image/') ||
               trimmed.startsWith('/') ||
               trimmed.startsWith('./') ||
               trimmed.startsWith('../') ||
               trimmed.startsWith('#');
    }

    parseMarkdown(text) {
        if (!text) return '<p style="color: var(--text-secondary, rgb(160, 160, 160));">Nothing to preview yet...</p>';

        // First, escape HTML to prevent injection
        let html = this.escapeHtml(text);

        // Now apply markdown transformations on escaped text
        // Images - validate URLs
        html = html.replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, (match, alt, url) => {
            const decodedUrl = url.replace(/&amp;/g, '&');
            if (this.isSafeUrl(decodedUrl)) {
                return `<img src="${decodedUrl}" alt="${alt}" />`;
            }
            return `[Image: ${alt}]`;
        });

        // Links - validate URLs
        html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, (match, text, url) => {
            const decodedUrl = url.replace(/&amp;/g, '&');
            if (this.isSafeUrl(decodedUrl)) {
                return `<a href="${decodedUrl}" rel="noopener noreferrer">${text}</a>`;
            }
            return text;
        });

        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // Bold
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

        // Italic
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

        // Code blocks
        html = html.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');

        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Blockquotes
        html = html.replace(/^&gt; (.*$)/gim, '<blockquote>$1</blockquote>');
        html = html.replace(/^&amp;gt; (.*$)/gim, '<blockquote>$1</blockquote>');

        // Line breaks
        html = html.replace(/\n\n/g, '</p><p>');
        html = html.replace(/\n/g, '<br />');

        // Wrap in paragraph if not already wrapped
        if (!html.startsWith('<')) {
            html = '<p>' + html + '</p>';
        }

        return html;
    }

    handleToolbarAction(action) {
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const selectedText = this.textarea.value.substring(start, end);
        const beforeText = this.textarea.value.substring(0, start);
        const afterText = this.textarea.value.substring(end);

        let newText = '';
        let cursorOffset = 0;

        switch (action) {
            case 'bold':
                newText = `**${selectedText || 'bold text'}**`;
                cursorOffset = selectedText ? newText.length : 2;
                break;

            case 'italic':
                newText = `*${selectedText || 'italic text'}*`;
                cursorOffset = selectedText ? newText.length : 1;
                break;

            case 'heading':
                newText = `## ${selectedText || 'Heading'}`;
                cursorOffset = selectedText ? newText.length : 3;
                break;

            case 'link':
                const url = prompt('Enter URL (must start with http://, https://, mailto:, or /):');
                if (url) {
                    // Validate URL before inserting
                    if (this.isSafeUrl(url)) {
                        newText = `[${selectedText || 'link text'}](${url})`;
                        cursorOffset = newText.length;
                    } else {
                        alert('Invalid URL. Please use http://, https://, mailto:, or relative paths starting with /');
                        return;
                    }
                }
                break;

            case 'image':
                this.fileInput.click();
                return;

            case 'list':
                newText = `- ${selectedText || 'list item'}`;
                cursorOffset = newText.length;
                break;

            case 'numbered':
                newText = `1. ${selectedText || 'list item'}`;
                cursorOffset = newText.length;
                break;

            case 'quote':
                newText = `> ${selectedText || 'quote'}`;
                cursorOffset = newText.length;
                break;

            case 'code':
                if (selectedText.includes('\n')) {
                    newText = `\`\`\`\n${selectedText || 'code'}\n\`\`\``;
                    cursorOffset = newText.length - 4;
                } else {
                    newText = `\`${selectedText || 'code'}\``;
                    cursorOffset = selectedText ? newText.length : 1;
                }
                break;
        }

        if (newText) {
            this.textarea.value = beforeText + newText + afterText;
            this.textarea.focus();
            this.textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);

            this.dispatchEvent(new CustomEvent('input', {
                detail: { value: this.textarea.value }
            }));
        }
    }

    handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            this.fileInput.value = '';
            return;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            alert('Image file is too large. Maximum size is 5MB.');
            this.fileInput.value = '';
            return;
        }

        const reader = new FileReader();

        reader.onload = (event) => {
            const dataUrl = event.target.result;
            // Sanitize filename - remove extension and escape special characters
            let altText = file.name.replace(/\.[^/.]+$/, '');
            altText = altText.replace(/[<>'"&]/g, ''); // Remove potentially problematic characters

            const start = this.textarea.selectionStart;
            const beforeText = this.textarea.value.substring(0, start);
            const afterText = this.textarea.value.substring(start);

            const imageMarkdown = `![${altText}](${dataUrl})`;
            this.textarea.value = beforeText + imageMarkdown + afterText;

            this.textarea.focus();
            this.textarea.setSelectionRange(
                start + imageMarkdown.length,
                start + imageMarkdown.length
            );

            this.dispatchEvent(new CustomEvent('input', {
                detail: { value: this.textarea.value }
            }));

            // Reset file input
            this.fileInput.value = '';
        };

        reader.onerror = (error) => {
            console.error('Error reading file:', error);
            alert('Failed to read image file. Please try again.');
            this.fileInput.value = '';
        };

        reader.readAsDataURL(file);
    }
}

customElements.define('markdown-editor', MarkdownEditor);
