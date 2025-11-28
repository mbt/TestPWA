// Prompt Detail/Edit Module
const PromptDetail = (function() {
    let currentPromptId = null;
    let editMode = false;

    // Render prompt detail page
    function render(promptId) {
        currentPromptId = promptId;
        editMode = promptId === 'new';

        const container = document.getElementById('app');
        const prompt = promptId === 'new' ? null : PromptGallery.getPromptById(promptId);

        if (!prompt && promptId !== 'new') {
            container.innerHTML = `
                <div class="error-page">
                    <h1>Prompt Not Found</h1>
                    <p>The prompt you're looking for doesn't exist.</p>
                    <button class="btn btn-primary" onclick="window.location.hash='#/prompts'">
                        Back to Gallery
                    </button>
                </div>
            `;
            return;
        }

        if (editMode || !prompt) {
            renderEditForm(prompt);
        } else {
            renderViewMode(prompt);
        }
    }

    function renderViewMode(prompt) {
        const container = document.getElementById('app');

        container.innerHTML = `
            <div class="prompt-detail">
                <div class="prompt-detail-header">
                    <button class="btn btn-back" onclick="window.location.hash='#/prompts'">
                        ← Back to Gallery
                    </button>
                    <div class="action-buttons">
                        ${!prompt.deprecated ? `
                            <button class="btn btn-primary" id="edit-btn">
                                ✏️ Edit
                            </button>
                        ` : ''}
                        ${!prompt.deprecated ? `
                            <button class="btn btn-warning" id="deprecate-btn">
                                🚫 Deprecate
                            </button>
                        ` : ''}
                        <button class="btn btn-danger" id="delete-btn">
                            🗑️ Delete
                        </button>
                    </div>
                </div>

                <div class="prompt-detail-content">
                    <div class="prompt-header-section">
                        <h1>${prompt.title}</h1>
                        <div class="badges">
                            <span class="badge model-family">${prompt.modelFamily}</span>
                            <span class="badge category">${prompt.category}</span>
                            ${prompt.deprecated ? '<span class="badge deprecated">Deprecated</span>' : ''}
                        </div>
                    </div>

                    ${prompt.description ? `
                        <div class="prompt-section">
                            <h2>Description</h2>
                            <div class="markdown-content">
                                ${renderMarkdown(prompt.description)}
                            </div>
                        </div>
                    ` : ''}

                    <div class="prompt-section">
                        <h2>Prompt</h2>
                        <div class="prompt-content">
                            <div class="markdown-content">
                                ${renderMarkdown(prompt.prompt)}
                            </div>
                            <button class="btn btn-secondary btn-copy" data-copy="prompt">
                                📋 Copy
                            </button>
                        </div>
                    </div>

                    <div class="prompt-metadata">
                        <div class="metadata-item">
                            <strong>Created:</strong>
                            ${new Date(prompt.dateAdded).toLocaleString()}
                        </div>
                        <div class="metadata-item">
                            <strong>Last Modified:</strong>
                            ${new Date(prompt.dateModified).toLocaleString()}
                        </div>
                    </div>

                    <div class="reviews-section">
                        <div class="reviews-header">
                            <h2>Reviews (${prompt.reviews.length})</h2>
                            <button class="btn btn-primary" id="add-review-btn">
                                + Add Review
                            </button>
                        </div>

                        ${prompt.reviews.length === 0 ? `
                            <p class="no-reviews">No reviews yet. Be the first to review this prompt!</p>
                        ` : `
                            <div class="reviews-list">
                                ${prompt.reviews.map(review => renderReview(review, prompt.id)).join('')}
                            </div>
                        `}
                    </div>
                </div>

                <!-- Add Review Modal -->
                <div id="review-modal" class="modal" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2>Add Review</h2>
                            <button class="modal-close" id="close-review-modal">×</button>
                        </div>
                        <div class="modal-body">
                            ${renderReviewForm()}
                        </div>
                    </div>
                </div>

                <!-- Edit Review Modal -->
                <div id="edit-review-modal" class="modal" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2>Edit Review</h2>
                            <button class="modal-close" id="close-edit-review-modal">×</button>
                        </div>
                        <div class="modal-body">
                            ${renderReviewForm('edit')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        attachViewModeListeners(prompt);
    }

    function renderReview(review, promptId) {
        return `
            <div class="review-card" data-review-id="${review.id}">
                <div class="review-header">
                    <div class="review-model">
                        <strong>${review.modelName || review.modelFamily}</strong>
                        <span class="review-date">${new Date(review.dateAdded).toLocaleDateString()}</span>
                    </div>
                    <div class="review-rating">
                        ${'⭐'.repeat(review.rating || 0)}
                    </div>
                </div>
                ${review.commentary ? `
                    <div class="review-commentary">
                        <h4>Commentary</h4>
                        <div class="markdown-content">
                            ${renderMarkdown(review.commentary)}
                        </div>
                    </div>
                ` : ''}
                ${review.outputResult ? `
                    <div class="review-output">
                        <h4>Output Result</h4>
                        <div class="markdown-content">
                            ${renderMarkdown(review.outputResult)}
                        </div>
                    </div>
                ` : ''}
                <div class="review-actions">
                    <button class="btn btn-sm" data-action="edit-review" data-review-id="${review.id}">
                        Edit
                    </button>
                    <button class="btn btn-sm btn-danger" data-action="delete-review" data-review-id="${review.id}">
                        Delete
                    </button>
                </div>
            </div>
        `;
    }

    function renderReviewForm(mode = 'add', reviewData = null) {
        const review = reviewData || {};
        return `
            <form id="${mode}-review-form" class="review-form">
                <div class="form-group">
                    <label>Model Family</label>
                    <select id="review-model-family" required>
                        ${PromptGallery.MODEL_FAMILIES.map(family => `
                            <option value="${family}" ${review.modelFamily === family ? 'selected' : ''}>
                                ${family}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label>Model Name</label>
                    <input
                        type="text"
                        id="review-model-name"
                        placeholder="e.g., Claude Sonnet 4.5"
                        value="${review.modelName || ''}"
                    />
                </div>

                <div class="form-group">
                    <label>Rating</label>
                    <div class="rating-input">
                        ${[1, 2, 3, 4, 5].map(star => `
                            <label class="star-label">
                                <input
                                    type="radio"
                                    name="rating"
                                    value="${star}"
                                    ${(review.rating || 3) === star ? 'checked' : ''}
                                />
                                <span class="star">⭐</span>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <div class="form-group">
                    <label>Commentary (Markdown supported)</label>
                    <markdown-editor
                        id="review-commentary"
                        placeholder="Share your thoughts about this prompt..."
                        value="${review.commentary || ''}"
                    ></markdown-editor>
                </div>

                <div class="form-group">
                    <label>Output Result (Markdown supported)</label>
                    <markdown-editor
                        id="review-output"
                        placeholder="What did the model generate? How well did it work?"
                        value="${review.outputResult || ''}"
                    ></markdown-editor>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">
                        ${mode === 'add' ? 'Add Review' : 'Update Review'}
                    </button>
                    <button type="button" class="btn btn-secondary" id="cancel-review-btn">
                        Cancel
                    </button>
                </div>
            </form>
        `;
    }

    function renderEditForm(prompt) {
        const container = document.getElementById('app');
        const isNew = !prompt;

        container.innerHTML = `
            <div class="prompt-edit">
                <div class="prompt-edit-header">
                    <button class="btn btn-back" onclick="window.location.hash='#/prompts'">
                        ← Cancel
                    </button>
                    <h1>${isNew ? 'New Prompt' : 'Edit Prompt'}</h1>
                </div>

                <form id="prompt-form" class="prompt-form">
                    <div class="form-group">
                        <label for="prompt-title">Title *</label>
                        <input
                            type="text"
                            id="prompt-title"
                            required
                            placeholder="Enter a descriptive title"
                            value="${prompt?.title || ''}"
                        />
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="prompt-model-family">Model Family *</label>
                            <select id="prompt-model-family" required>
                                ${PromptGallery.MODEL_FAMILIES.map(family => `
                                    <option value="${family}" ${(prompt?.modelFamily || 'Claude') === family ? 'selected' : ''}>
                                        ${family}
                                    </option>
                                `).join('')}
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="prompt-category">Category *</label>
                            <select id="prompt-category" required>
                                ${PromptGallery.CATEGORIES.map(cat => `
                                    <option value="${cat}" ${(prompt?.category || 'Other') === cat ? 'selected' : ''}>
                                        ${cat}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="prompt-description">Description (Markdown supported)</label>
                        <markdown-editor
                            id="prompt-description"
                            placeholder="Provide a brief description of what this prompt does..."
                            value="${prompt?.description || ''}"
                        ></markdown-editor>
                    </div>

                    <div class="form-group">
                        <label for="prompt-text">Prompt Text * (Markdown supported)</label>
                        <markdown-editor
                            id="prompt-text"
                            placeholder="Enter your prompt here. Use placeholders like [INSERT TOPIC] for customizable parts..."
                            value="${prompt?.prompt || ''}"
                        ></markdown-editor>
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">
                            ${isNew ? 'Create Prompt' : 'Save Changes'}
                        </button>
                        <button type="button" class="btn btn-secondary" id="cancel-edit-btn">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        `;

        attachEditModeListeners(prompt);
    }

    function attachViewModeListeners(prompt) {
        // Edit button
        document.getElementById('edit-btn')?.addEventListener('click', () => {
            editMode = true;
            renderEditForm(prompt);
        });

        // Deprecate button
        document.getElementById('deprecate-btn')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to deprecate this prompt?')) {
                PromptGallery.deprecatePrompt(prompt.id);
                render(prompt.id);
            }
        });

        // Delete button
        document.getElementById('delete-btn')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this prompt? This action cannot be undone.')) {
                PromptGallery.deletePrompt(prompt.id);
                window.location.hash = '#/prompts';
            }
        });

        // Copy button
        document.querySelector('[data-copy="prompt"]')?.addEventListener('click', () => {
            navigator.clipboard.writeText(prompt.prompt).then(() => {
                alert('Prompt copied to clipboard!');
            });
        });

        // Add review button
        document.getElementById('add-review-btn')?.addEventListener('click', () => {
            showReviewModal();
        });

        // Review actions
        document.querySelectorAll('[data-action="edit-review"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const reviewId = e.target.getAttribute('data-review-id');
                const review = prompt.reviews.find(r => r.id === reviewId);
                if (review) {
                    showEditReviewModal(review);
                }
            });
        });

        document.querySelectorAll('[data-action="delete-review"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const reviewId = e.target.getAttribute('data-review-id');
                if (confirm('Are you sure you want to delete this review?')) {
                    PromptGallery.deleteReview(prompt.id, reviewId);
                    render(prompt.id);
                }
            });
        });
    }

    function showReviewModal() {
        const modal = document.getElementById('review-modal');
        modal.style.display = 'flex';

        const form = document.getElementById('add-review-form');
        const closeBtn = document.getElementById('close-review-modal');
        const cancelBtn = document.getElementById('cancel-review-btn');

        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const reviewData = {
                modelFamily: document.getElementById('review-model-family').value,
                modelName: document.getElementById('review-model-name').value,
                rating: parseInt(document.querySelector('input[name="rating"]:checked').value),
                commentary: document.getElementById('review-commentary').value,
                outputResult: document.getElementById('review-output').value
            };

            PromptGallery.addReview(currentPromptId, reviewData);
            modal.style.display = 'none';
            render(currentPromptId);
        });
    }

    function showEditReviewModal(review) {
        const modal = document.getElementById('edit-review-modal');
        modal.querySelector('.modal-body').innerHTML = renderReviewForm('edit', review);
        modal.style.display = 'flex';

        const form = document.getElementById('edit-review-form');
        const closeBtn = document.getElementById('close-edit-review-modal');
        const cancelBtn = form.querySelector('#cancel-review-btn');

        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const reviewData = {
                modelFamily: document.getElementById('review-model-family').value,
                modelName: document.getElementById('review-model-name').value,
                rating: parseInt(document.querySelector('input[name="rating"]:checked').value),
                commentary: document.getElementById('review-commentary').value,
                outputResult: document.getElementById('review-output').value
            };

            PromptGallery.updateReview(currentPromptId, review.id, reviewData);
            modal.style.display = 'none';
            render(currentPromptId);
        });
    }

    function attachEditModeListeners(prompt) {
        const form = document.getElementById('prompt-form');
        const cancelBtn = document.getElementById('cancel-edit-btn');

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const promptData = {
                title: document.getElementById('prompt-title').value.trim(),
                modelFamily: document.getElementById('prompt-model-family').value,
                category: document.getElementById('prompt-category').value,
                description: document.getElementById('prompt-description').value.trim(),
                prompt: document.getElementById('prompt-text').value.trim()
            };

            // Validate required fields
            if (!promptData.title || !promptData.prompt) {
                alert('Please fill in all required fields (Title and Prompt)');
                return;
            }

            // Validate title length
            if (promptData.title.length < 3) {
                alert('Title must be at least 3 characters long');
                return;
            }

            if (promptData.title.length > 200) {
                alert('Title must be less than 200 characters');
                return;
            }

            // Validate prompt length
            if (promptData.prompt.length < 10) {
                alert('Prompt text must be at least 10 characters long');
                return;
            }

            if (prompt) {
                PromptGallery.updatePrompt(prompt.id, promptData);
                editMode = false;
                render(prompt.id);
            } else {
                const newPrompt = PromptGallery.addPrompt(promptData);
                window.location.hash = `#/prompts/${newPrompt.id}`;
            }
        });

        cancelBtn.addEventListener('click', () => {
            if (prompt) {
                editMode = false;
                render(prompt.id);
            } else {
                window.location.hash = '#/prompts';
            }
        });
    }

    // HTML escape function to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Validate URL to prevent XSS via javascript: protocol
    function isSafeUrl(url) {
        if (!url) return false;
        const trimmed = url.trim().toLowerCase();
        // Allow http, https, mailto, and relative URLs
        return trimmed.startsWith('http://') ||
               trimmed.startsWith('https://') ||
               trimmed.startsWith('mailto:') ||
               trimmed.startsWith('/') ||
               trimmed.startsWith('./') ||
               trimmed.startsWith('../') ||
               trimmed.startsWith('#');
    }

    function renderMarkdown(text) {
        if (!text) return '';

        // First, escape HTML to prevent injection
        let html = escapeHtml(text);

        // Now apply markdown transformations on escaped text
        // Images - validate URLs
        html = html.replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, (match, alt, url) => {
            const decodedUrl = url.replace(/&amp;/g, '&');
            if (isSafeUrl(decodedUrl)) {
                return `<img src="${decodedUrl}" alt="${alt}" />`;
            }
            return `[Image: ${alt}]`;
        });

        // Links - validate URLs
        html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, (match, text, url) => {
            const decodedUrl = url.replace(/&amp;/g, '&');
            if (isSafeUrl(decodedUrl)) {
                return `<a href="${decodedUrl}" target="_blank" rel="noopener noreferrer">${text}</a>`;
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
        if (!html.startsWith('<h') && !html.startsWith('<p') && !html.startsWith('<ul') && !html.startsWith('<ol')) {
            html = '<p>' + html + '</p>';
        }

        return html;
    }

    function destroy() {
        const container = document.getElementById('app');
        container.innerHTML = '';
        currentPromptId = null;
        editMode = false;
    }

    return {
        render,
        destroy
    };
})();
