/*
 * Conversations Gallery Module
 * Lists all LLM conversations
 */

const ConversationsGallery = (function() {
    let conversations = [];

    // Initialize the module
    async function init() {
        try {
            conversations = await ConversationDB.getAllConversations();
        } catch (error) {
            console.error('Failed to load conversations:', error);
            conversations = [];
        }
    }

    // Render the conversations gallery
    async function render() {
        await init();

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="container">
                <div class="page-header">
                    <div>
                        <h1>Conversations</h1>
                        <p class="subtitle">Chat with AI models via Ollama</p>
                    </div>
                    <button class="btn btn-primary" id="new-conversation-btn">
                        + New Conversation
                    </button>
                </div>

                <div class="connection-status" id="connection-status">
                    <span class="status-indicator" id="status-indicator"></span>
                    <span id="status-text">Connecting...</span>
                </div>

                <div class="conversations-grid" id="conversations-grid">
                    ${renderConversations()}
                </div>
            </div>
        `;

        attachEventListeners();
        updateConnectionStatus();

        // Connect to WebSocket on page load
        connectToOllama();
    }

    // Render conversations grid
    function renderConversations() {
        if (conversations.length === 0) {
            return `
                <div class="empty-state">
                    <h2>No conversations yet</h2>
                    <p>Start a new conversation with an AI model</p>
                    <button class="btn btn-primary" id="new-conversation-empty">
                        + New Conversation
                    </button>
                </div>
            `;
        }

        return conversations.map(conv => `
            <div class="conversation-card" data-id="${conv.id}">
                <div class="conversation-header">
                    <h3>${escapeHtml(conv.title)}</h3>
                    <div class="conversation-actions">
                        <button class="btn btn-icon" data-action="delete" data-id="${conv.id}" title="Delete">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="conversation-meta">
                    <span class="badge model">${escapeHtml(conv.model)}</span>
                    <span class="message-count">${conv.messageCount || 0} messages</span>
                </div>
                <div class="conversation-footer">
                    <span class="date">
                        ${formatDate(conv.dateModified)}
                    </span>
                    <button class="btn btn-sm" data-action="open" data-id="${conv.id}">
                        Open
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Update the conversations grid without full re-render
    async function updateGrid() {
        conversations = await ConversationDB.getAllConversations();
        const grid = document.getElementById('conversations-grid');
        if (grid) {
            grid.innerHTML = renderConversations();
        }
    }

    // Connect to Ollama WebSocket
    async function connectToOllama() {
        try {
            await OllamaService.connect();
            updateConnectionStatus();
        } catch (error) {
            console.error('Failed to connect to Ollama:', error);
            updateConnectionStatus();
        }
    }

    // Update connection status indicator
    function updateConnectionStatus() {
        const statusIndicator = document.getElementById('status-indicator');
        const statusText = document.getElementById('status-text');

        if (!statusIndicator || !statusText) return;

        const state = OllamaService.getState();

        statusIndicator.className = 'status-indicator';

        switch (state) {
            case 'connected':
                statusIndicator.classList.add('connected');
                statusText.textContent = 'Connected to Ollama';
                break;
            case 'connecting':
                statusIndicator.classList.add('connecting');
                statusText.textContent = 'Connecting...';
                break;
            case 'disconnected':
                statusIndicator.classList.add('disconnected');
                statusText.textContent = 'Disconnected';
                break;
            default:
                statusIndicator.classList.add('disconnected');
                statusText.textContent = 'Unknown status';
        }
    }

    // Create a new conversation
    async function createNewConversation() {
        try {
            // Get available models first
            let models = [];
            try {
                const modelsResponse = await OllamaService.getModels();
                models = modelsResponse.models || [];
            } catch (error) {
                console.error('Failed to fetch models:', error);
            }

            const defaultModel = models.length > 0 ? models[0].name : 'llama2';

            const conversation = await ConversationDB.createConversation({
                title: 'New Conversation',
                model: defaultModel,
                provider: 'ollama'
            });

            // Navigate to the new conversation
            Router.navigate(`#/conversations/${conversation.id}`);
        } catch (error) {
            console.error('Failed to create conversation:', error);
            alert('Failed to create conversation');
        }
    }

    // Delete a conversation
    async function deleteConversation(id) {
        if (!confirm('Are you sure you want to delete this conversation? This cannot be undone.')) {
            return;
        }

        try {
            await ConversationDB.deleteConversation(id);
            await updateGrid();
        } catch (error) {
            console.error('Failed to delete conversation:', error);
            alert('Failed to delete conversation');
        }
    }

    // Attach event listeners
    function attachEventListeners() {
        // New conversation button
        const newBtn = document.getElementById('new-conversation-btn');
        if (newBtn) {
            newBtn.addEventListener('click', createNewConversation);
        }

        const newBtnEmpty = document.getElementById('new-conversation-empty');
        if (newBtnEmpty) {
            newBtnEmpty.addEventListener('click', createNewConversation);
        }

        // Conversation card actions
        const grid = document.getElementById('conversations-grid');
        if (grid) {
            grid.addEventListener('click', async (e) => {
                const action = e.target.dataset.action;
                const id = parseInt(e.target.dataset.id);

                if (!action || !id) return;

                e.stopPropagation();

                switch (action) {
                    case 'open':
                        Router.navigate(`#/conversations/${id}`);
                        break;
                    case 'delete':
                        await deleteConversation(id);
                        break;
                }
            });

            // Click on card to open (except on action buttons)
            grid.addEventListener('click', (e) => {
                const card = e.target.closest('.conversation-card');
                if (card && !e.target.closest('button')) {
                    const id = card.dataset.id;
                    Router.navigate(`#/conversations/${id}`);
                }
            });
        }

        // Listen for connection state changes
        OllamaService.on('connected', () => {
            updateConnectionStatus();
        });

        OllamaService.on('disconnected', () => {
            updateConnectionStatus();
        });
    }

    // Format date for display
    function formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString();
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Cleanup when leaving the page
    function destroy() {
        // Clean up any event listeners or resources
    }

    return {
        render,
        destroy
    };
})();
