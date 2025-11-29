/*
 * Knowledge Bases Gallery View
 * Lists all knowledge bases with create, edit, delete functionality
 */

const KnowledgeBasesGallery = (function() {
    let knowledgeBases = [];
    let container = null;

    const render = async () => {
        container = document.getElementById('app');
        if (!container) return;

        container.innerHTML = '';

        // Load knowledge bases from database
        try {
            knowledgeBases = await KnowledgeBaseDB.getAllKnowledgeBases();
        } catch (error) {
            console.error('Failed to load knowledge bases:', error);
            knowledgeBases = [];
        }

        // Create main container
        const view = document.createElement('div');
        view.className = 'knowledge-bases-view';

        // Header
        const header = document.createElement('header');
        header.className = 'view-header';

        const title = document.createElement('h1');
        title.textContent = 'Knowledge Bases';

        const subtitle = document.createElement('p');
        subtitle.className = 'view-subtitle';
        subtitle.textContent = 'Manage collections of documents for contextual AI assistance';

        const createBtn = document.createElement('button');
        createBtn.className = 'btn btn-primary';
        createBtn.textContent = '+ Create Knowledge Base';
        createBtn.onclick = showCreateDialog;

        header.appendChild(title);
        header.appendChild(subtitle);
        header.appendChild(createBtn);

        // Knowledge bases grid
        const grid = document.createElement('div');
        grid.className = 'kb-grid';
        grid.id = 'kb-grid';

        if (knowledgeBases.length === 0) {
            const emptyState = createEmptyState();
            grid.appendChild(emptyState);
        } else {
            knowledgeBases
                .sort((a, b) => new Date(b.dateModified) - new Date(a.dateModified))
                .forEach(kb => {
                    const card = createKnowledgeBaseCard(kb);
                    grid.appendChild(card);
                });
        }

        view.appendChild(header);
        view.appendChild(grid);
        container.appendChild(view);
    };

    const createEmptyState = () => {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <div class="empty-state-icon">📚</div>
            <h2>No Knowledge Bases Yet</h2>
            <p>Create your first knowledge base to start organizing documents for AI context.</p>
            <button class="btn btn-primary" onclick="KnowledgeBasesGallery.showCreateDialog()">
                Create Your First Knowledge Base
            </button>
        `;
        return emptyState;
    };

    const createKnowledgeBaseCard = (kb) => {
        const card = document.createElement('div');
        card.className = 'kb-card';

        const cardHeader = document.createElement('div');
        cardHeader.className = 'kb-card-header';

        const icon = document.createElement('div');
        icon.className = 'kb-icon';
        icon.textContent = '📚';

        const name = document.createElement('h3');
        name.className = 'kb-name';
        name.textContent = kb.name;

        cardHeader.appendChild(icon);
        cardHeader.appendChild(name);

        const description = document.createElement('p');
        description.className = 'kb-description';
        description.textContent = kb.description || 'No description provided';

        const stats = document.createElement('div');
        stats.className = 'kb-stats';

        const docCount = document.createElement('span');
        docCount.className = 'kb-stat';
        docCount.innerHTML = `<strong>${kb.documentCount || 0}</strong> documents`;

        const size = document.createElement('span');
        size.className = 'kb-stat';
        size.innerHTML = `<strong>${formatBytes(kb.totalSize || 0)}</strong>`;

        stats.appendChild(docCount);
        stats.appendChild(size);

        const meta = document.createElement('div');
        meta.className = 'kb-meta';

        const date = document.createElement('span');
        date.className = 'kb-date';
        date.textContent = `Modified: ${new Date(kb.dateModified).toLocaleDateString()}`;

        meta.appendChild(date);

        // Tags
        if (kb.tags && kb.tags.length > 0) {
            const tagsContainer = document.createElement('div');
            tagsContainer.className = 'kb-tags';
            kb.tags.forEach(tag => {
                const tagEl = document.createElement('span');
                tagEl.className = 'kb-tag';
                tagEl.textContent = tag;
                tagsContainer.appendChild(tagEl);
            });
            meta.appendChild(tagsContainer);
        }

        const actions = document.createElement('div');
        actions.className = 'kb-actions';

        const viewBtn = document.createElement('button');
        viewBtn.className = 'btn btn-secondary btn-sm';
        viewBtn.textContent = 'View';
        viewBtn.onclick = () => {
            window.AppRouter.navigate(`/knowledge-bases/${kb.id}`);
        };

        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-secondary btn-sm';
        editBtn.textContent = 'Edit';
        editBtn.onclick = (e) => {
            e.stopPropagation();
            showEditDialog(kb);
        };

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger btn-sm';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            showDeleteConfirm(kb);
        };

        actions.appendChild(viewBtn);
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        card.appendChild(cardHeader);
        card.appendChild(description);
        card.appendChild(stats);
        card.appendChild(meta);
        card.appendChild(actions);

        return card;
    };

    const showCreateDialog = () => {
        const dialog = document.createElement('dialog');
        dialog.className = 'kb-dialog';

        const form = document.createElement('form');
        form.method = 'dialog';
        form.className = 'kb-form';

        const contentForm = document.createElement('div');
        contentForm.className = 'kb-form-content';

        const modalHeader = document.createElement('div');
        modalHeader.className = 'kb-dialog-header';
        const modalTitle = document.createElement('h2');
        modalTitle.textContent = 'Create Knowledge Base';
        modalHeader.appendChild(modalTitle);

        contentForm.innerHTML = `
            <div class="form-group">
                <label for="kb-name">Name *</label>
                <input type="text" id="kb-name" name="name" required placeholder="e.g., Technical Documentation">
            </div>
            <div class="form-group">
                <label for="kb-description">Description (Markdown supported)</label>
                <markdown-editor
                    id="kb-description"
                    placeholder="Describe the purpose of this knowledge base..."
                ></markdown-editor>
            </div>
            <div class="form-group">
                <label for="kb-tags">Tags</label>
                <input type="text" id="kb-tags" name="tags" placeholder="e.g., technical, api, guides (comma-separated)">
            </div>
            <div class="kb-dialog-actions">
                <button type="button" class="btn btn-secondary" id="cancel-btn">Cancel</button>
                <button type="button" class="btn btn-primary" id="create-btn">Create</button>
            </div>
        `;

        form.appendChild(modalHeader);
        form.appendChild(contentForm);
        dialog.appendChild(form);
        document.body.appendChild(dialog);

        // Handle cancel
        dialog.querySelector('#cancel-btn').onclick = () => {
            dialog.close();
            dialog.remove();
        };

        // Handle create
        dialog.querySelector('#create-btn').onclick = async () => {
            const formData = new FormData();
            formData.append('name', document.getElementById('kb-name').value);
            formData.append('tags', document.getElementById('kb-tags').value);

            const descEditor = document.getElementById('kb-description');
            const description = descEditor ? descEditor.value : '';
            const tags = formData.get('tags')
                .split(',')
                .map(t => t.trim())
                .filter(t => t);

            if (!formData.get('name')) {
                alert('Please provide a name');
                return;
            }

            try {
                await KnowledgeBaseDB.createKnowledgeBase({
                    name: formData.get('name'),
                    description: description,
                    tags
                });
                dialog.close();
                dialog.remove();
                render();
            } catch (error) {
                console.error('Failed to create knowledge base:', error);
                alert('Failed to create knowledge base. Please try again.');
            }
        };

        dialog.showModal();

        // Focus the name input
        setTimeout(() => {
            document.getElementById('kb-name').focus();
        }, 100);
    };

    const showEditDialog = (kb) => {
        const dialog = document.createElement('dialog');
        dialog.className = 'kb-dialog';

        const form = document.createElement('form');
        form.method = 'dialog';
        form.className = 'kb-form';

        const contentForm = document.createElement('div');
        contentForm.className = 'kb-form-content';

        const modalHeader = document.createElement('div');
        modalHeader.className = 'kb-dialog-header';
        const modalTitle = document.createElement('h2');
        modalTitle.textContent = 'Edit Knowledge Base';
        modalHeader.appendChild(modalTitle);

        contentForm.innerHTML = `
            <div class="form-group">
                <label for="kb-name">Name *</label>
                <input type="text" id="kb-name" name="name" required value="${escapeHtml(kb.name)}">
            </div>
            <div class="form-group">
                <label for="kb-description">Description (Markdown supported)</label>
                <markdown-editor
                    id="kb-description"
                    placeholder="Describe the purpose of this knowledge base..."
                    value="${escapeHtml(kb.description || '')}"
                ></markdown-editor>
            </div>
            <div class="form-group">
                <label for="kb-tags">Tags</label>
                <input type="text" id="kb-tags" name="tags" value="${escapeHtml((kb.tags || []).join(', '))}">
            </div>
            <div class="kb-dialog-actions">
                <button type="button" class="btn btn-secondary" id="cancel-btn">Cancel</button>
                <button type="button" class="btn btn-primary" id="save-btn">Save Changes</button>
            </div>
        `;

        form.appendChild(modalHeader);
        form.appendChild(contentForm);
        dialog.appendChild(form);
        document.body.appendChild(dialog);

        // Handle cancel
        dialog.querySelector('#cancel-btn').onclick = () => {
            dialog.close();
            dialog.remove();
        };

        // Handle save
        dialog.querySelector('#save-btn').onclick = async () => {
            const formData = new FormData();
            formData.append('name', document.getElementById('kb-name').value);
            formData.append('tags', document.getElementById('kb-tags').value);

            const descEditor = document.getElementById('kb-description');
            const description = descEditor ? descEditor.value : '';
            const tags = formData.get('tags')
                .split(',')
                .map(t => t.trim())
                .filter(t => t);

            if (!formData.get('name')) {
                alert('Please provide a name');
                return;
            }

            try {
                await KnowledgeBaseDB.updateKnowledgeBase(kb.id, {
                    name: formData.get('name'),
                    description: description,
                    tags
                });
                dialog.close();
                dialog.remove();
                render();
            } catch (error) {
                console.error('Failed to update knowledge base:', error);
                alert('Failed to update knowledge base. Please try again.');
            }
        };

        dialog.showModal();

        // Focus the name input
        setTimeout(() => {
            document.getElementById('kb-name').focus();
        }, 100);
    };

    const showDeleteConfirm = (kb) => {
        if (!confirm(`Are you sure you want to delete "${kb.name}"? This will also delete all ${kb.documentCount || 0} documents in this knowledge base. This action cannot be undone.`)) {
            return;
        }

        KnowledgeBaseDB.deleteKnowledgeBase(kb.id)
            .then(() => {
                render();
            })
            .catch(error => {
                console.error('Failed to delete knowledge base:', error);
                alert('Failed to delete knowledge base. Please try again.');
            });
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

    const destroy = () => {
        if (container) {
            container.innerHTML = '';
        }
    };

    // Public API
    return {
        render,
        destroy,
        showCreateDialog
    };
})();
