/*
 * Knowledge Base Detail View
 * Shows documents in a knowledge base with upload, search, and management features
 */

const KnowledgeBaseDetail = (function() {
    let knowledgeBase = null;
    let documents = [];
    let filteredDocuments = [];
    let container = null;
    let searchQuery = '';

    const render = async (kbId) => {
        container = document.getElementById('app');
        if (!container) return;

        container.innerHTML = '';

        // Load knowledge base and documents
        try {
            knowledgeBase = await KnowledgeBaseDB.getKnowledgeBase(parseInt(kbId));
            if (!knowledgeBase) {
                showError('Knowledge base not found');
                return;
            }
            documents = await KnowledgeBaseDB.getDocumentsByKnowledgeBase(parseInt(kbId));
            filteredDocuments = documents;
        } catch (error) {
            console.error('Failed to load knowledge base:', error);
            showError('Failed to load knowledge base');
            return;
        }

        // Create main container
        const view = document.createElement('div');
        view.className = 'kb-detail-view';

        // Back button
        const backBtn = document.createElement('a');
        backBtn.href = '#/knowledge-bases';
        backBtn.className = 'back-button';
        backBtn.innerHTML = '&larr; Back to Knowledge Bases';

        // Header
        const header = document.createElement('header');
        header.className = 'kb-detail-header';

        const titleSection = document.createElement('div');
        titleSection.className = 'kb-detail-title-section';

        const icon = document.createElement('div');
        icon.className = 'kb-detail-icon';
        icon.textContent = '📚';

        const titleGroup = document.createElement('div');
        const title = document.createElement('h1');
        title.textContent = knowledgeBase.name;

        const description = document.createElement('p');
        description.className = 'kb-detail-description';
        description.textContent = knowledgeBase.description || 'No description provided';

        titleGroup.appendChild(title);
        titleGroup.appendChild(description);

        titleSection.appendChild(icon);
        titleSection.appendChild(titleGroup);

        // Stats
        const stats = document.createElement('div');
        stats.className = 'kb-detail-stats';
        stats.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${documents.length}</div>
                <div class="stat-label">Documents</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${formatBytes(knowledgeBase.totalSize || 0)}</div>
                <div class="stat-label">Total Size</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${new Date(knowledgeBase.dateModified).toLocaleDateString()}</div>
                <div class="stat-label">Last Modified</div>
            </div>
        `;

        header.appendChild(titleSection);
        header.appendChild(stats);

        // Toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'kb-toolbar';

        const searchBox = document.createElement('div');
        searchBox.className = 'search-box';
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search documents...';
        searchInput.className = 'search-input';
        searchInput.value = searchQuery;
        searchInput.oninput = (e) => {
            searchQuery = e.target.value;
            filterDocuments();
        };
        searchBox.appendChild(searchInput);

        const uploadBtn = document.createElement('button');
        uploadBtn.className = 'btn btn-primary';
        uploadBtn.innerHTML = '📄 Upload Document';
        uploadBtn.onclick = showUploadDialog;

        const uploadTextBtn = document.createElement('button');
        uploadTextBtn.className = 'btn btn-secondary';
        uploadTextBtn.innerHTML = '✏️ Add Text Document';
        uploadTextBtn.onclick = showTextDocumentDialog;

        toolbar.appendChild(searchBox);
        toolbar.appendChild(uploadTextBtn);
        toolbar.appendChild(uploadBtn);

        // Documents grid
        const documentsSection = document.createElement('div');
        documentsSection.className = 'documents-section';
        documentsSection.id = 'documents-section';

        if (filteredDocuments.length === 0 && documents.length === 0) {
            documentsSection.appendChild(createEmptyState());
        } else if (filteredDocuments.length === 0) {
            documentsSection.appendChild(createNoResultsState());
        } else {
            const grid = document.createElement('div');
            grid.className = 'documents-grid';
            filteredDocuments
                .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
                .forEach(doc => {
                    const card = createDocumentCard(doc);
                    grid.appendChild(card);
                });
            documentsSection.appendChild(grid);
        }

        view.appendChild(backBtn);
        view.appendChild(header);
        view.appendChild(toolbar);
        view.appendChild(documentsSection);
        container.appendChild(view);
    };

    const filterDocuments = () => {
        const lowerQuery = searchQuery.toLowerCase().trim();
        if (!lowerQuery) {
            filteredDocuments = documents;
        } else {
            filteredDocuments = documents.filter(doc => {
                return doc.name.toLowerCase().includes(lowerQuery) ||
                       doc.content.toLowerCase().includes(lowerQuery) ||
                       doc.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
            });
        }
        refreshDocumentsSection();
    };

    const refreshDocumentsSection = () => {
        const section = document.getElementById('documents-section');
        if (!section) return;

        section.innerHTML = '';

        if (filteredDocuments.length === 0 && documents.length === 0) {
            section.appendChild(createEmptyState());
        } else if (filteredDocuments.length === 0) {
            section.appendChild(createNoResultsState());
        } else {
            const grid = document.createElement('div');
            grid.className = 'documents-grid';
            filteredDocuments
                .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
                .forEach(doc => {
                    const card = createDocumentCard(doc);
                    grid.appendChild(card);
                });
            section.appendChild(grid);
        }
    };

    const createEmptyState = () => {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <div class="empty-state-icon">📄</div>
            <h2>No Documents Yet</h2>
            <p>Upload files or create text documents to start building this knowledge base.</p>
        `;
        return emptyState;
    };

    const createNoResultsState = () => {
        const noResults = document.createElement('div');
        noResults.className = 'empty-state';
        noResults.innerHTML = `
            <div class="empty-state-icon">🔍</div>
            <h2>No Results Found</h2>
            <p>Try a different search term or clear the search to see all documents.</p>
        `;
        return noResults;
    };

    const createDocumentCard = (doc) => {
        const card = document.createElement('div');
        card.className = 'document-card';

        const cardHeader = document.createElement('div');
        cardHeader.className = 'document-card-header';

        const typeIcon = getTypeIcon(doc.type);
        const icon = document.createElement('div');
        icon.className = 'document-icon';
        icon.textContent = typeIcon;

        const name = document.createElement('h3');
        name.className = 'document-name';
        name.textContent = doc.name;

        cardHeader.appendChild(icon);
        cardHeader.appendChild(name);

        const preview = document.createElement('div');
        preview.className = 'document-preview';
        const previewText = doc.content.substring(0, 150);
        preview.textContent = previewText + (doc.content.length > 150 ? '...' : '');

        const meta = document.createElement('div');
        meta.className = 'document-meta';

        const size = document.createElement('span');
        size.className = 'document-size';
        size.textContent = formatBytes(doc.size);

        const date = document.createElement('span');
        date.className = 'document-date';
        date.textContent = new Date(doc.dateAdded).toLocaleDateString();

        meta.appendChild(size);
        meta.appendChild(date);

        // Tags
        if (doc.tags && doc.tags.length > 0) {
            const tagsContainer = document.createElement('div');
            tagsContainer.className = 'document-tags';
            doc.tags.forEach(tag => {
                const tagEl = document.createElement('span');
                tagEl.className = 'document-tag';
                tagEl.textContent = tag;
                tagsContainer.appendChild(tagEl);
            });
            meta.appendChild(tagsContainer);
        }

        const actions = document.createElement('div');
        actions.className = 'document-actions';

        const viewBtn = document.createElement('button');
        viewBtn.className = 'btn btn-secondary btn-sm';
        viewBtn.textContent = 'View';
        viewBtn.onclick = () => showDocumentViewer(doc);

        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-secondary btn-sm';
        editBtn.textContent = 'Edit';
        editBtn.onclick = () => showEditDocumentDialog(doc);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger btn-sm';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => deleteDocument(doc);

        actions.appendChild(viewBtn);
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        card.appendChild(cardHeader);
        card.appendChild(preview);
        card.appendChild(meta);
        card.appendChild(actions);

        return card;
    };

    const showUploadDialog = () => {
        const dialog = document.createElement('div');
        dialog.className = 'modal-overlay';
        dialog.onclick = (e) => {
            if (e.target === dialog) {
                dialog.remove();
            }
        };

        const modal = document.createElement('div');
        modal.className = 'modal';

        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        const modalTitle = document.createElement('h2');
        modalTitle.textContent = 'Upload Document';
        modalHeader.appendChild(modalTitle);

        const form = document.createElement('form');
        form.className = 'kb-form';
        form.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const file = formData.get('file');

            if (!file || file.size === 0) {
                alert('Please select a file to upload');
                return;
            }

            try {
                const content = await readFileAsText(file);
                const tags = formData.get('tags')
                    .split(',')
                    .map(t => t.trim())
                    .filter(t => t);

                await KnowledgeBaseDB.createDocument({
                    knowledgeBaseId: knowledgeBase.id,
                    name: file.name,
                    content: content,
                    type: file.type || 'text/plain',
                    size: file.size,
                    tags: tags,
                    metadata: {
                        originalFileName: file.name,
                        uploadDate: new Date().toISOString()
                    }
                });

                dialog.remove();
                await render(knowledgeBase.id);
            } catch (error) {
                console.error('Failed to upload document:', error);
                alert('Failed to upload document. Please try again.');
            }
        };

        form.innerHTML = `
            <div class="form-group">
                <label for="doc-file">File *</label>
                <input type="file" id="doc-file" name="file" required accept=".txt,.md,.json,.xml,.csv,.html,.css,.js,.py,.java,.c,.cpp,.h,.hpp">
                <small>Supported: Text, Markdown, JSON, XML, CSV, HTML, CSS, JavaScript, Python, Java, C/C++</small>
            </div>
            <div class="form-group">
                <label for="doc-tags">Tags</label>
                <input type="text" id="doc-tags" name="tags" placeholder="e.g., api, documentation, reference (comma-separated)">
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                <button type="submit" class="btn btn-primary">Upload</button>
            </div>
        `;

        modal.appendChild(modalHeader);
        modal.appendChild(form);
        dialog.appendChild(modal);
        document.body.appendChild(dialog);
    };

    const showTextDocumentDialog = () => {
        const dialog = document.createElement('div');
        dialog.className = 'modal-overlay';
        dialog.onclick = (e) => {
            if (e.target === dialog) {
                dialog.remove();
            }
        };

        const modal = document.createElement('div');
        modal.className = 'modal modal-large';

        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        const modalTitle = document.createElement('h2');
        modalTitle.textContent = 'Create Text Document';
        modalHeader.appendChild(modalTitle);

        const form = document.createElement('form');
        form.className = 'kb-form';
        form.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const content = formData.get('content');
            const name = formData.get('name');

            if (!name || !content) {
                alert('Please provide both name and content');
                return;
            }

            try {
                const tags = formData.get('tags')
                    .split(',')
                    .map(t => t.trim())
                    .filter(t => t);

                await KnowledgeBaseDB.createDocument({
                    knowledgeBaseId: knowledgeBase.id,
                    name: name,
                    content: content,
                    type: 'text/plain',
                    size: new Blob([content]).size,
                    tags: tags,
                    metadata: {
                        createdDate: new Date().toISOString()
                    }
                });

                dialog.remove();
                await render(knowledgeBase.id);
            } catch (error) {
                console.error('Failed to create document:', error);
                alert('Failed to create document. Please try again.');
            }
        };

        form.innerHTML = `
            <div class="form-group">
                <label for="doc-name">Document Name *</label>
                <input type="text" id="doc-name" name="name" required placeholder="e.g., API Reference.txt">
            </div>
            <div class="form-group">
                <label for="doc-content">Content *</label>
                <textarea id="doc-content" name="content" rows="15" required placeholder="Enter the document content here..."></textarea>
            </div>
            <div class="form-group">
                <label for="doc-tags">Tags</label>
                <input type="text" id="doc-tags" name="tags" placeholder="e.g., api, documentation, reference (comma-separated)">
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                <button type="submit" class="btn btn-primary">Create Document</button>
            </div>
        `;

        modal.appendChild(modalHeader);
        modal.appendChild(form);
        dialog.appendChild(modal);
        document.body.appendChild(dialog);

        // Focus the name input
        setTimeout(() => {
            document.getElementById('doc-name').focus();
        }, 100);
    };

    const showEditDocumentDialog = (doc) => {
        const dialog = document.createElement('div');
        dialog.className = 'modal-overlay';
        dialog.onclick = (e) => {
            if (e.target === dialog) {
                dialog.remove();
            }
        };

        const modal = document.createElement('div');
        modal.className = 'modal modal-large';

        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        const modalTitle = document.createElement('h2');
        modalTitle.textContent = 'Edit Document';
        modalHeader.appendChild(modalTitle);

        const form = document.createElement('form');
        form.className = 'kb-form';
        form.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const content = formData.get('content');
            const name = formData.get('name');

            try {
                const tags = formData.get('tags')
                    .split(',')
                    .map(t => t.trim())
                    .filter(t => t);

                await KnowledgeBaseDB.updateDocument(doc.id, {
                    name: name,
                    content: content,
                    size: new Blob([content]).size,
                    tags: tags
                });

                dialog.remove();
                await render(knowledgeBase.id);
            } catch (error) {
                console.error('Failed to update document:', error);
                alert('Failed to update document. Please try again.');
            }
        };

        form.innerHTML = `
            <div class="form-group">
                <label for="doc-name">Document Name *</label>
                <input type="text" id="doc-name" name="name" required value="${escapeHtml(doc.name)}">
            </div>
            <div class="form-group">
                <label for="doc-content">Content *</label>
                <textarea id="doc-content" name="content" rows="15" required>${escapeHtml(doc.content)}</textarea>
            </div>
            <div class="form-group">
                <label for="doc-tags">Tags</label>
                <input type="text" id="doc-tags" name="tags" value="${escapeHtml((doc.tags || []).join(', '))}">
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Changes</button>
            </div>
        `;

        modal.appendChild(modalHeader);
        modal.appendChild(form);
        dialog.appendChild(modal);
        document.body.appendChild(dialog);

        // Focus the name input
        setTimeout(() => {
            document.getElementById('doc-name').focus();
        }, 100);
    };

    const showDocumentViewer = (doc) => {
        const dialog = document.createElement('div');
        dialog.className = 'modal-overlay';
        dialog.onclick = (e) => {
            if (e.target === dialog) {
                dialog.remove();
            }
        };

        const modal = document.createElement('div');
        modal.className = 'modal modal-large';

        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';

        const titleGroup = document.createElement('div');
        const modalTitle = document.createElement('h2');
        modalTitle.textContent = doc.name;
        const modalMeta = document.createElement('div');
        modalMeta.className = 'document-viewer-meta';
        modalMeta.innerHTML = `
            <span>${formatBytes(doc.size)}</span>
            <span>${new Date(doc.dateAdded).toLocaleDateString()}</span>
        `;
        titleGroup.appendChild(modalTitle);
        titleGroup.appendChild(modalMeta);

        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal-close-btn';
        closeBtn.innerHTML = '×';
        closeBtn.onclick = () => dialog.remove();

        modalHeader.appendChild(titleGroup);
        modalHeader.appendChild(closeBtn);

        const content = document.createElement('div');
        content.className = 'document-viewer-content';
        const pre = document.createElement('pre');
        pre.textContent = doc.content;
        content.appendChild(pre);

        const actions = document.createElement('div');
        actions.className = 'modal-actions';

        const copyBtn = document.createElement('button');
        copyBtn.className = 'btn btn-secondary';
        copyBtn.textContent = 'Copy to Clipboard';
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(doc.content)
                .then(() => {
                    copyBtn.textContent = 'Copied!';
                    setTimeout(() => {
                        copyBtn.textContent = 'Copy to Clipboard';
                    }, 2000);
                })
                .catch(err => {
                    console.error('Failed to copy:', err);
                    alert('Failed to copy to clipboard');
                });
        };

        const closeActionBtn = document.createElement('button');
        closeActionBtn.className = 'btn btn-primary';
        closeActionBtn.textContent = 'Close';
        closeActionBtn.onclick = () => dialog.remove();

        actions.appendChild(copyBtn);
        actions.appendChild(closeActionBtn);

        modal.appendChild(modalHeader);
        modal.appendChild(content);
        modal.appendChild(actions);
        dialog.appendChild(modal);
        document.body.appendChild(dialog);
    };

    const deleteDocument = async (doc) => {
        if (!confirm(`Are you sure you want to delete "${doc.name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await KnowledgeBaseDB.deleteDocument(doc.id);
            await render(knowledgeBase.id);
        } catch (error) {
            console.error('Failed to delete document:', error);
            alert('Failed to delete document. Please try again.');
        }
    };

    const readFileAsText = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    };

    const getTypeIcon = (type) => {
        if (type.includes('text')) return '📄';
        if (type.includes('json')) return '📋';
        if (type.includes('xml')) return '📰';
        if (type.includes('html')) return '🌐';
        if (type.includes('javascript')) return '📜';
        if (type.includes('python')) return '🐍';
        if (type.includes('java')) return '☕';
        if (type.includes('markdown')) return '📝';
        return '📄';
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    const showError = (message) => {
        container.innerHTML = `
            <div class="error-state">
                <h2>Error</h2>
                <p>${message}</p>
                <a href="#/knowledge-bases" class="btn btn-primary">Back to Knowledge Bases</a>
            </div>
        `;
    };

    const destroy = () => {
        if (container) {
            container.innerHTML = '';
        }
        knowledgeBase = null;
        documents = [];
        filteredDocuments = [];
        searchQuery = '';
    };

    // Public API
    return {
        render,
        destroy
    };
})();
