// Prompt Gallery Module
const PromptGallery = (function() {
    const STORAGE_KEY = 'prompt-gallery-data';

    // Model families and categories
    const MODEL_FAMILIES = ['Claude', 'Kimi', 'MiniMax', 'Generic'];
    const CATEGORIES = [
        'Entertainment',
        'Programming',
        'Writing',
        'Education',
        'Business',
        'Creative',
        'Research',
        'Other'
    ];

    // Load prompts from localStorage or use default data
    let prompts = loadFromStorage() || [
        {
            id: 'creative-story-writer',
            title: 'Creative Story Writer',
            description: 'A versatile prompt for generating engaging short stories with rich character development.',
            prompt: `Write a compelling short story (500-800 words) with the following elements:
- A relatable protagonist facing an internal conflict
- Vivid sensory details that bring the setting to life
- A clear narrative arc with rising action and resolution
- Dialogue that reveals character personality

Theme: **[INSERT THEME]**
Setting: **[INSERT SETTING]**`,
            modelFamily: 'Claude',
            category: 'Creative',
            dateAdded: '2025-11-20T10:00:00Z',
            dateModified: '2025-11-20T10:00:00Z',
            deprecated: false,
            reviews: [
                {
                    id: 'rev-1',
                    dateAdded: '2025-11-21T14:30:00Z',
                    modelName: 'Claude Sonnet 4.5',
                    modelFamily: 'Claude',
                    commentary: 'Generated an excellent mystery story with strong atmosphere and character depth.',
                    outputResult: 'Successfully created a 750-word noir detective story with compelling dialogue.',
                    rating: 5
                }
            ]
        },
        {
            id: 'python-debugger',
            title: 'Python Code Debugger',
            description: 'Expert prompt for analyzing and fixing Python code with detailed explanations.',
            prompt: `You are an expert Python developer. Analyze the following code and:

1. Identify any bugs or potential issues
2. Explain what's wrong in clear terms
3. Provide the corrected code
4. Suggest performance improvements if applicable

Code to analyze:
\`\`\`python
[INSERT CODE HERE]
\`\`\``,
            modelFamily: 'Claude',
            category: 'Programming',
            dateAdded: '2025-11-18T15:30:00Z',
            dateModified: '2025-11-18T15:30:00Z',
            deprecated: false,
            reviews: []
        },
        {
            id: 'learning-tutor',
            title: 'Interactive Learning Tutor',
            description: 'Socratic method-based prompt for teaching complex concepts through guided questions.',
            prompt: `Act as a patient tutor using the Socratic method. For the topic **[TOPIC]**:

1. Start by asking what the student already knows
2. Guide them through discovery with thoughtful questions
3. Build on correct answers and gently correct misconceptions
4. Use analogies and real-world examples
5. Check understanding at each step

Remember: Never just give answers - help the student discover them!`,
            modelFamily: 'Claude',
            category: 'Education',
            dateAdded: '2025-11-15T09:00:00Z',
            dateModified: '2025-11-19T11:20:00Z',
            deprecated: false,
            reviews: [
                {
                    id: 'rev-2',
                    dateAdded: '2025-11-16T10:00:00Z',
                    modelName: 'Claude Sonnet 3.5',
                    modelFamily: 'Claude',
                    commentary: 'Excellent teaching approach. The model asked probing questions and built understanding incrementally.',
                    outputResult: 'Successfully guided student through understanding quantum entanglement basics.',
                    rating: 5
                }
            ]
        }
    ];

    // Load data from localStorage
    function loadFromStorage() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Failed to load prompts from storage:', e);
            return null;
        }
    }

    // Save data to localStorage
    function saveToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
        } catch (e) {
            console.error('Failed to save prompts to storage:', e);
        }
    }

    // Generate unique ID
    function generateId() {
        return 'prompt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    // Get all prompts (optionally filtered)
    function getPrompts(filters = {}) {
        let filtered = [...prompts];

        // Filter by model family
        if (filters.modelFamily && filters.modelFamily !== 'all') {
            filtered = filtered.filter(p => p.modelFamily === filters.modelFamily);
        }

        // Filter by category
        if (filters.category && filters.category !== 'all') {
            filtered = filtered.filter(p => p.category === filters.category);
        }

        // Filter by deprecated status
        if (filters.showDeprecated === false) {
            filtered = filtered.filter(p => !p.deprecated);
        }

        // Search by text
        if (filters.searchText) {
            const searchLower = filters.searchText.toLowerCase();
            filtered = filtered.filter(p =>
                p.title.toLowerCase().includes(searchLower) ||
                p.description.toLowerCase().includes(searchLower) ||
                p.prompt.toLowerCase().includes(searchLower)
            );
        }

        return filtered;
    }

    // Get sorted prompts
    function getPromptsSorted(filters = {}, sortBy = 'dateAdded', reverse = false) {
        let sorted = getPrompts(filters);

        switch (sortBy) {
            case 'title':
                sorted.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'category':
                sorted.sort((a, b) => {
                    const catCompare = a.category.localeCompare(b.category);
                    return catCompare !== 0 ? catCompare : a.title.localeCompare(b.title);
                });
                break;
            case 'dateAdded':
                sorted.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
                break;
            case 'dateModified':
                sorted.sort((a, b) => new Date(b.dateModified) - new Date(a.dateModified));
                break;
        }

        if (reverse) {
            sorted.reverse();
        }

        return sorted;
    }

    // Get single prompt by ID
    function getPromptById(id) {
        return prompts.find(p => p.id === id);
    }

    // Add new prompt
    function addPrompt(promptData) {
        const newPrompt = {
            id: generateId(),
            title: promptData.title || 'Untitled Prompt',
            description: promptData.description || '',
            prompt: promptData.prompt || '',
            modelFamily: promptData.modelFamily || 'Claude',
            category: promptData.category || 'Other',
            dateAdded: new Date().toISOString(),
            dateModified: new Date().toISOString(),
            deprecated: false,
            reviews: []
        };

        prompts.push(newPrompt);
        saveToStorage();
        return newPrompt;
    }

    // Update existing prompt
    function updatePrompt(id, updates) {
        const index = prompts.findIndex(p => p.id === id);
        if (index === -1) return null;

        prompts[index] = {
            ...prompts[index],
            ...updates,
            id: prompts[index].id, // Preserve ID
            dateAdded: prompts[index].dateAdded, // Preserve creation date
            dateModified: new Date().toISOString(),
            reviews: prompts[index].reviews // Preserve reviews
        };

        saveToStorage();
        return prompts[index];
    }

    // Mark prompt as deprecated
    function deprecatePrompt(id) {
        const prompt = getPromptById(id);
        if (!prompt) return null;

        return updatePrompt(id, { deprecated: true });
    }

    // Delete prompt
    function deletePrompt(id) {
        const index = prompts.findIndex(p => p.id === id);
        if (index === -1) return false;

        prompts.splice(index, 1);
        saveToStorage();
        return true;
    }

    // Add review to prompt
    function addReview(promptId, reviewData) {
        const prompt = getPromptById(promptId);
        if (!prompt) return null;

        const newReview = {
            id: 'rev-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            dateAdded: new Date().toISOString(),
            modelName: reviewData.modelName || '',
            modelFamily: reviewData.modelFamily || 'Claude',
            commentary: reviewData.commentary || '',
            outputResult: reviewData.outputResult || '',
            rating: reviewData.rating || 3
        };

        prompt.reviews.push(newReview);
        prompt.dateModified = new Date().toISOString();
        saveToStorage();
        return newReview;
    }

    // Update review
    function updateReview(promptId, reviewId, updates) {
        const prompt = getPromptById(promptId);
        if (!prompt) return null;

        const reviewIndex = prompt.reviews.findIndex(r => r.id === reviewId);
        if (reviewIndex === -1) return null;

        prompt.reviews[reviewIndex] = {
            ...prompt.reviews[reviewIndex],
            ...updates,
            id: prompt.reviews[reviewIndex].id,
            dateAdded: prompt.reviews[reviewIndex].dateAdded
        };

        prompt.dateModified = new Date().toISOString();
        saveToStorage();
        return prompt.reviews[reviewIndex];
    }

    // Delete review
    function deleteReview(promptId, reviewId) {
        const prompt = getPromptById(promptId);
        if (!prompt) return false;

        const reviewIndex = prompt.reviews.findIndex(r => r.id === reviewId);
        if (reviewIndex === -1) return false;

        prompt.reviews.splice(reviewIndex, 1);
        prompt.dateModified = new Date().toISOString();
        saveToStorage();
        return true;
    }

    // Export to JSON
    function exportToJSON() {
        const data = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            prompts: prompts
        };
        return JSON.stringify(data, null, 2);
    }

    // Import from JSON
    function importFromJSON(jsonString, options = {}) {
        try {
            const data = JSON.parse(jsonString);

            if (!data.prompts || !Array.isArray(data.prompts)) {
                throw new Error('Invalid JSON format: missing prompts array');
            }

            const imported = [];
            const errors = [];

            data.prompts.forEach((promptData, index) => {
                try {
                    // Validate required fields
                    if (!promptData.title || !promptData.prompt) {
                        throw new Error('Missing required fields (title or prompt)');
                    }

                    // Check for duplicate IDs if merging
                    if (options.mode === 'merge') {
                        const existing = getPromptById(promptData.id);
                        if (existing) {
                            // Generate new ID to avoid conflicts
                            promptData.id = generateId();
                        }
                    }

                    // Ensure ID exists
                    if (!promptData.id) {
                        promptData.id = generateId();
                    }

                    // Set defaults for missing fields
                    const newPrompt = {
                        id: promptData.id,
                        title: promptData.title,
                        description: promptData.description || '',
                        prompt: promptData.prompt,
                        modelFamily: MODEL_FAMILIES.includes(promptData.modelFamily) ?
                            promptData.modelFamily : 'Claude',
                        category: CATEGORIES.includes(promptData.category) ?
                            promptData.category : 'Other',
                        dateAdded: promptData.dateAdded || new Date().toISOString(),
                        dateModified: promptData.dateModified || new Date().toISOString(),
                        deprecated: promptData.deprecated || false,
                        reviews: promptData.reviews || []
                    };

                    imported.push(newPrompt);
                } catch (e) {
                    errors.push({ index, error: e.message });
                }
            });

            if (options.mode === 'replace') {
                prompts = imported;
            } else {
                prompts.push(...imported);
            }

            saveToStorage();

            return {
                success: true,
                imported: imported.length,
                errors: errors
            };
        } catch (e) {
            return {
                success: false,
                error: e.message
            };
        }
    }

    // Get statistics
    function getStats() {
        return {
            total: prompts.length,
            active: prompts.filter(p => !p.deprecated).length,
            deprecated: prompts.filter(p => p.deprecated).length,
            byModelFamily: MODEL_FAMILIES.reduce((acc, family) => {
                acc[family] = prompts.filter(p => p.modelFamily === family).length;
                return acc;
            }, {}),
            byCategory: CATEGORIES.reduce((acc, category) => {
                acc[category] = prompts.filter(p => p.category === category).length;
                return acc;
            }, {}),
            totalReviews: prompts.reduce((sum, p) => sum + p.reviews.length, 0)
        };
    }

    // Render the gallery listing page
    function render() {
        const container = document.getElementById('app');

        // Get current filters and sort from localStorage or use defaults
        const savedFilters = JSON.parse(localStorage.getItem('prompt-filters') || '{}');
        const currentFilters = {
            modelFamily: savedFilters.modelFamily || 'all',
            category: savedFilters.category || 'all',
            showDeprecated: savedFilters.showDeprecated !== false,
            searchText: savedFilters.searchText || ''
        };
        const currentSort = savedFilters.sortBy || 'dateAdded';
        const currentReverse = savedFilters.reverse || false;

        const filtered = getPromptsSorted(currentFilters, currentSort, currentReverse);
        const stats = getStats();

        container.innerHTML = `
            <div class="prompt-gallery">
                <header class="prompt-gallery-header">
                    <h1>Prompt Gallery</h1>
                    <p class="subtitle">
                        Manage and organize prompts for language models
                    </p>
                    <div class="stats-bar">
                        <span class="stat">${stats.active} Active</span>
                        <span class="stat">${stats.deprecated} Deprecated</span>
                        <span class="stat">${stats.totalReviews} Reviews</span>
                    </div>
                </header>

                <div class="prompt-controls">
                    <div class="control-row">
                        <div class="search-box">
                            <input
                                type="text"
                                id="search-input"
                                placeholder="Search prompts..."
                                value="${currentFilters.searchText}"
                            />
                        </div>
                        <button class="btn btn-primary" id="add-prompt-btn">
                            + Add Prompt
                        </button>
                        <button class="btn btn-secondary" id="import-btn">
                            📥 Import
                        </button>
                        <button class="btn btn-secondary" id="export-btn">
                            📤 Export
                        </button>
                    </div>

                    <div class="control-row">
                        <div class="filter-group">
                            <label>Model Family:</label>
                            <select id="model-family-filter">
                                <option value="all" ${currentFilters.modelFamily === 'all' ? 'selected' : ''}>
                                    All Models
                                </option>
                                ${MODEL_FAMILIES.map(family => `
                                    <option value="${family}" ${currentFilters.modelFamily === family ? 'selected' : ''}>
                                        ${family}
                                    </option>
                                `).join('')}
                            </select>
                        </div>

                        <div class="filter-group">
                            <label>Category:</label>
                            <select id="category-filter">
                                <option value="all" ${currentFilters.category === 'all' ? 'selected' : ''}>
                                    All Categories
                                </option>
                                ${CATEGORIES.map(cat => `
                                    <option value="${cat}" ${currentFilters.category === cat ? 'selected' : ''}>
                                        ${cat}
                                    </option>
                                `).join('')}
                            </select>
                        </div>

                        <div class="filter-group">
                            <label>Sort By:</label>
                            <select id="sort-by">
                                <option value="dateAdded" ${currentSort === 'dateAdded' ? 'selected' : ''}>
                                    Date Added
                                </option>
                                <option value="dateModified" ${currentSort === 'dateModified' ? 'selected' : ''}>
                                    Date Modified
                                </option>
                                <option value="title" ${currentSort === 'title' ? 'selected' : ''}>
                                    Title
                                </option>
                                <option value="category" ${currentSort === 'category' ? 'selected' : ''}>
                                    Category
                                </option>
                            </select>
                            <button class="btn btn-icon" id="reverse-btn" title="Reverse order">
                                ${currentReverse ? '↑' : '↓'}
                            </button>
                        </div>

                        <div class="filter-group">
                            <label>
                                <input
                                    type="checkbox"
                                    id="show-deprecated"
                                    ${currentFilters.showDeprecated ? 'checked' : ''}
                                />
                                Show Deprecated
                            </label>
                        </div>
                    </div>
                </div>

                <div class="prompt-grid">
                    ${filtered.length === 0 ? `
                        <div class="empty-state">
                            <p>No prompts found matching your filters.</p>
                            <button class="btn btn-primary" id="add-first-prompt">
                                Add Your First Prompt
                            </button>
                        </div>
                    ` : filtered.map(prompt => `
                        <div class="prompt-card ${prompt.deprecated ? 'deprecated' : ''}"
                             data-id="${prompt.id}">
                            <div class="prompt-card-header">
                                <h3>${prompt.title}</h3>
                                ${prompt.deprecated ? '<span class="badge deprecated">Deprecated</span>' : ''}
                            </div>
                            <p class="prompt-description">${prompt.description}</p>
                            <div class="prompt-meta">
                                <span class="badge model-family">${prompt.modelFamily}</span>
                                <span class="badge category">${prompt.category}</span>
                                ${prompt.reviews.length > 0 ? `
                                    <span class="review-count">⭐ ${prompt.reviews.length} reviews</span>
                                ` : ''}
                            </div>
                            <div class="prompt-footer">
                                <span class="date">
                                    ${new Date(prompt.dateModified).toLocaleDateString()}
                                </span>
                                <button class="btn btn-sm" data-action="view" data-id="${prompt.id}">
                                    View
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <input type="file" id="import-file-input" accept=".json" style="display: none;" />
            </div>
        `;

        attachEventListeners(currentFilters, currentSort, currentReverse);
    }

    function attachEventListeners(currentFilters, currentSort, currentReverse) {
        // Search
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                currentFilters.searchText = e.target.value;
                saveFilters(currentFilters, currentSort, currentReverse);
                render();
            });
        }

        // Filters
        document.getElementById('model-family-filter')?.addEventListener('change', (e) => {
            currentFilters.modelFamily = e.target.value;
            saveFilters(currentFilters, currentSort, currentReverse);
            render();
        });

        document.getElementById('category-filter')?.addEventListener('change', (e) => {
            currentFilters.category = e.target.value;
            saveFilters(currentFilters, currentSort, currentReverse);
            render();
        });

        document.getElementById('show-deprecated')?.addEventListener('change', (e) => {
            currentFilters.showDeprecated = e.target.checked;
            saveFilters(currentFilters, currentSort, currentReverse);
            render();
        });

        // Sorting
        document.getElementById('sort-by')?.addEventListener('change', (e) => {
            currentSort = e.target.value;
            saveFilters(currentFilters, currentSort, currentReverse);
            render();
        });

        document.getElementById('reverse-btn')?.addEventListener('click', () => {
            currentReverse = !currentReverse;
            saveFilters(currentFilters, currentSort, currentReverse);
            render();
        });

        // Add prompt
        document.getElementById('add-prompt-btn')?.addEventListener('click', () => {
            window.location.hash = '#/prompts/new';
        });

        document.getElementById('add-first-prompt')?.addEventListener('click', () => {
            window.location.hash = '#/prompts/new';
        });

        // View prompt
        document.querySelectorAll('[data-action="view"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                window.location.hash = `#/prompts/${id}`;
            });
        });

        // Import/Export
        document.getElementById('import-btn')?.addEventListener('click', () => {
            document.getElementById('import-file-input').click();
        });

        document.getElementById('import-file-input')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const result = importFromJSON(event.target.result, { mode: 'merge' });
                if (result.success) {
                    alert(`Successfully imported ${result.imported} prompts!`);
                    render();
                } else {
                    alert(`Import failed: ${result.error}`);
                }
                e.target.value = ''; // Reset input
            };
            reader.readAsText(file);
        });

        document.getElementById('export-btn')?.addEventListener('click', () => {
            const json = exportToJSON();
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `prompts-export-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    function saveFilters(filters, sortBy, reverse) {
        localStorage.setItem('prompt-filters', JSON.stringify({
            ...filters,
            sortBy,
            reverse
        }));
    }

    function destroy() {
        const container = document.getElementById('app');
        container.innerHTML = '';
    }

    // Public API
    return {
        render,
        destroy,
        getPrompts,
        getPromptsSorted,
        getPromptById,
        addPrompt,
        updatePrompt,
        deprecatePrompt,
        deletePrompt,
        addReview,
        updateReview,
        deleteReview,
        exportToJSON,
        importFromJSON,
        getStats,
        MODEL_FAMILIES,
        CATEGORIES
    };
})();
