/*
 * Conversation Detail Module
 * Chat interface for a single conversation
 */

const ConversationDetail = (function() {
    let conversationId = null;
    let conversation = null;
    let messages = [];
    let isGenerating = false;
    let currentMessageId = null;
    let availableModels = [];
    let selectedImages = []; // Array of {data: base64, preview: url} objects
    let enableTools = true; // Enable/disable tools for conversation

    // Initialize the module
    async function init(id) {
        conversationId = parseInt(id);

        try {
            const data = await ConversationDB.getConversationWithMessages(conversationId);
            if (!data) {
                Router.navigate('#/conversations');
                return false;
            }

            conversation = data;
            messages = data.messages || [];

            // Connect to Ollama if not connected
            if (!OllamaService.isConnected()) {
                await OllamaService.connect();
            }

            // Fetch available models
            try {
                const modelsResponse = await OllamaService.getModels();
                availableModels = modelsResponse.models || [];
            } catch (error) {
                console.error('Failed to fetch models:', error);
                availableModels = [];
            }

            return true;
        } catch (error) {
            console.error('Failed to load conversation:', error);
            Router.navigate('#/conversations');
            return false;
        }
    }

    // Render the conversation detail page
    async function render(id) {
        const success = await init(id);
        if (!success) return;

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="conversation-detail">
                <div class="conversation-header">
                    <button class="btn btn-icon" id="back-btn" title="Back to conversations">
                        ← Back
                    </button>
                    <div class="conversation-title-section">
                        <input
                            type="text"
                            id="conversation-title"
                            value="${escapeHtml(conversation.title)}"
                            class="conversation-title-input"
                        />
                    </div>
                    <div class="conversation-controls">
                        <select id="model-selector" class="model-selector" ${isGenerating ? 'disabled' : ''}>
                            ${renderModelOptions()}
                        </select>
                        <button class="btn btn-sm" id="clear-btn" title="Clear conversation" ${isGenerating ? 'disabled' : ''}>
                            Clear
                        </button>
                    </div>
                </div>

                <div class="messages-container" id="messages-container">
                    ${renderMessages()}
                </div>

                <div class="input-container">
                    <div id="image-previews" class="image-previews"></div>
                    <div class="input-actions">
                        <button class="btn btn-icon" id="image-upload-btn" title="Upload image" ${isGenerating ? 'disabled' : ''}>
                            📷
                        </button>
                        <button class="btn btn-icon" id="camera-btn" title="Take photo" ${isGenerating ? 'disabled' : ''}>
                            📸
                        </button>
                        <label class="tools-toggle">
                            <input type="checkbox" id="tools-toggle" ${enableTools ? 'checked' : ''} ${isGenerating ? 'disabled' : ''}>
                            <span>Tools</span>
                        </label>
                    </div>
                    <div class="input-wrapper">
                        <textarea
                            id="message-input"
                            placeholder="Type your message..."
                            rows="3"
                            ${isGenerating ? 'disabled' : ''}
                        ></textarea>
                        <button
                            id="send-btn"
                            class="btn btn-primary"
                            ${isGenerating ? 'disabled' : ''}
                        >
                            ${isGenerating ? 'Generating...' : 'Send'}
                        </button>
                    </div>
                    <input type="file" id="image-file-input" accept="image/*" style="display: none;" multiple />
                    <input type="file" id="camera-input" accept="image/*" capture="environment" style="display: none;" />
                </div>
            </div>
        `;

        attachEventListeners();
        scrollToBottom();

        // Focus input
        const input = document.getElementById('message-input');
        if (input) {
            input.focus();
        }
    }

    // Render model options for dropdown
    function renderModelOptions() {
        if (availableModels.length === 0) {
            return `<option value="${escapeHtml(conversation.model)}">${escapeHtml(conversation.model)}</option>`;
        }

        return availableModels.map(model => `
            <option value="${escapeHtml(model.name)}" ${model.name === conversation.model ? 'selected' : ''}>
                ${escapeHtml(model.name)}
            </option>
        `).join('');
    }

    // Render messages
    function renderMessages() {
        if (messages.length === 0) {
            return `
                <div class="empty-messages">
                    <p>No messages yet. Start a conversation!</p>
                </div>
            `;
        }

        return messages.map(msg => {
            const roleLabel = msg.role === 'user' ? 'You' : (msg.role === 'tool' ? '🔧 Tool' : 'Assistant');

            // Render images if present
            const imagesHtml = (msg.images && msg.images.length > 0)
                ? `<div class="message-images">
                    ${msg.images.map(img => `<img src="${img}" class="message-image" />`).join('')}
                   </div>`
                : '';

            // Render tool calls if present
            const toolCallsHtml = (msg.tool_calls && msg.tool_calls.length > 0)
                ? `<div class="tool-calls">
                    ${msg.tool_calls.map(tc => `
                        <div class="tool-call">
                            <strong>🔧 ${escapeHtml(tc.function.name)}</strong>
                            <pre><code>${escapeHtml(JSON.stringify(tc.function.arguments, null, 2))}</code></pre>
                        </div>
                    `).join('')}
                   </div>`
                : '';

            return `
                <div class="message ${msg.role}" data-id="${msg.id}">
                    <div class="message-header">
                        <span class="message-role">${roleLabel}</span>
                        <span class="message-time">${formatTime(msg.timestamp)}</span>
                    </div>
                    ${imagesHtml}
                    ${toolCallsHtml}
                    <div class="message-content">
                        ${formatMessage(msg.content)}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Update messages display without full re-render
    function updateMessages() {
        const container = document.getElementById('messages-container');
        if (container) {
            container.innerHTML = renderMessages();
            scrollToBottom();
        }
    }

    // Add or update a message in the UI
    function updateMessageInUI(messageId, content, isComplete = false) {
        const container = document.getElementById('messages-container');
        if (!container) return;

        let messageEl = container.querySelector(`[data-id="${messageId}"]`);

        if (!messageEl) {
            // Create new message element
            const msg = messages.find(m => m.id === messageId);
            if (!msg) return;

            const div = document.createElement('div');
            div.className = `message ${msg.role}`;
            div.dataset.id = messageId;
            div.innerHTML = `
                <div class="message-header">
                    <span class="message-role">${msg.role === 'user' ? 'You' : 'Assistant'}</span>
                    <span class="message-time">${formatTime(msg.timestamp)}</span>
                </div>
                <div class="message-content">
                    ${formatMessage(content)}${isComplete ? '' : '<span class="cursor">▋</span>'}
                </div>
            `;
            container.appendChild(div);
            messageEl = div;
        } else {
            // Update existing message
            const contentEl = messageEl.querySelector('.message-content');
            if (contentEl) {
                contentEl.innerHTML = formatMessage(content) + (isComplete ? '' : '<span class="cursor">▋</span>');
            }
        }

        scrollToBottom();
    }

    // Handle image file selection
    async function handleImageSelection(files) {
        for (const file of files) {
            if (!file.type.startsWith('image/')) continue;

            try {
                const base64 = await fileToBase64(file);
                const preview = URL.createObjectURL(file);

                selectedImages.push({ data: base64, preview });
            } catch (error) {
                console.error('Failed to process image:', error);
            }
        }

        updateImagePreviews();
    }

    // Convert file to base64
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Update image previews
    function updateImagePreviews() {
        const container = document.getElementById('image-previews');
        if (!container) return;

        if (selectedImages.length === 0) {
            container.innerHTML = '';
            container.style.display = 'none';
            return;
        }

        container.style.display = 'flex';
        container.innerHTML = selectedImages.map((img, index) => `
            <div class="image-preview">
                <img src="${img.preview}" />
                <button class="remove-image" data-index="${index}">✕</button>
            </div>
        `).join('');

        // Add event listeners for remove buttons
        container.querySelectorAll('.remove-image').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                URL.revokeObjectURL(selectedImages[index].preview);
                selectedImages.splice(index, 1);
                updateImagePreviews();
            });
        });
    }

    // Send chat with tool execution support
    async function sendChatWithTools(apiMessages, tools) {
        let fullResponse = '';
        let toolCallsReceived = [];

        await OllamaService.chat(
            conversation.model,
            apiMessages,
            {},
            async (chunk, accumulatedText, isComplete, toolCalls) => {
                // Handle text content
                if (chunk.message && chunk.message.content) {
                    fullResponse = accumulatedText;
                    updateMessageInUI(currentMessageId, fullResponse, false);

                    if (!isComplete) {
                        await ConversationDB.updateMessage(currentMessageId, {
                            content: fullResponse
                        });
                    }
                }

                // Handle tool calls
                if (toolCalls && toolCalls.length > 0) {
                    toolCallsReceived = toolCalls;
                }

                if (isComplete) {
                    // Final update
                    await ConversationDB.updateMessage(currentMessageId, {
                        content: fullResponse,
                        tool_calls: toolCallsReceived
                    });

                    const msgIndex = messages.findIndex(m => m.id === currentMessageId);
                    if (msgIndex !== -1) {
                        messages[msgIndex].content = fullResponse;
                        messages[msgIndex].tool_calls = toolCallsReceived;
                    }

                    updateMessageInUI(currentMessageId, fullResponse, true);

                    // Execute tools if any were called
                    if (toolCallsReceived.length > 0) {
                        await executeTools(toolCallsReceived, apiMessages);
                    }
                }
            },
            tools
        );
    }

    // Execute tools and continue conversation
    async function executeTools(toolCalls, previousMessages) {
        for (const toolCall of toolCalls) {
            const { name, arguments: args } = toolCall.function;

            try {
                // Parse arguments
                const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;

                // Execute tool
                const result = await ToolRegistry.executeTool(name, parsedArgs);

                // Add tool result message
                const toolMessage = await ConversationDB.addMessage(conversationId, {
                    role: 'tool',
                    content: JSON.stringify(result, null, 2),
                    metadata: { toolName: name, arguments: parsedArgs }
                });

                messages.push(toolMessage);
                updateMessages();

                // Build updated message history
                const updatedMessages = [...previousMessages, {
                    role: 'assistant',
                    content: messages[messages.length - 2].content, // Last assistant message
                    tool_calls: toolCalls
                }, {
                    role: 'tool',
                    content: toolMessage.content
                }];

                // Continue conversation with tool result
                const followUpMessage = await ConversationDB.addMessage(conversationId, {
                    role: 'assistant',
                    content: ''
                });

                messages.push(followUpMessage);
                currentMessageId = followUpMessage.id;

                // Send follow-up request
                await sendChatWithTools(updatedMessages, null); // Don't send tools again in follow-up

            } catch (error) {
                console.error(`Tool execution failed: ${name}`, error);

                // Add error message
                const errorMessage = await ConversationDB.addMessage(conversationId, {
                    role: 'tool',
                    content: `Error: ${error.message}`,
                    metadata: { toolName: name, error: true }
                });

                messages.push(errorMessage);
                updateMessages();
            }
        }
    }

    // Send a message
    async function sendMessage() {
        const input = document.getElementById('message-input');
        const sendBtn = document.getElementById('send-btn');

        if (!input || !sendBtn) return;

        const messageText = input.value.trim();
        if ((!messageText && selectedImages.length === 0) || isGenerating) return;

        // Disable input
        isGenerating = true;
        input.disabled = true;
        input.value = '';
        sendBtn.disabled = true;
        sendBtn.textContent = 'Generating...';

        try {
            // Collect images for this message
            const messageImages = selectedImages.map(img => img.data);

            // Add user message to database
            const userMessage = await ConversationDB.addMessage(conversationId, {
                role: 'user',
                content: messageText,
                images: messageImages
            });

            messages.push(userMessage);

            // Clear selected images
            selectedImages = [];
            updateImagePreviews();
            updateMessages();

            // Create assistant message placeholder
            const assistantMessage = await ConversationDB.addMessage(conversationId, {
                role: 'assistant',
                content: ''
            });

            messages.push(assistantMessage);
            currentMessageId = assistantMessage.id;

            // Build message history for API (include images)
            const apiMessages = messages.map(msg => {
                const apiMsg = {
                    role: msg.role,
                    content: msg.content
                };
                // Add images if present
                if (msg.images && msg.images.length > 0) {
                    apiMsg.images = msg.images;
                }
                return apiMsg;
            });

            // Get tools if enabled
            const tools = enableTools && ToolRegistry.hasTools() ? ToolRegistry.getToolSchemas() : null;

            // Send to Ollama via WebSocket with tool handling
            await sendChatWithTools(apiMessages, tools);

            // Re-enable input
            isGenerating = false;
            input.disabled = false;
            sendBtn.disabled = false;
            sendBtn.textContent = 'Send';
            input.focus();
            currentMessageId = null;
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('Failed to send message: ' + error.message);

            // Re-enable input
            isGenerating = false;
            input.disabled = false;
            sendBtn.disabled = false;
            sendBtn.textContent = 'Send';
            currentMessageId = null;
        }
    }

    // Clear conversation
    async function clearConversation() {
        if (!confirm('Are you sure you want to clear all messages? This cannot be undone.')) {
            return;
        }

        try {
            // Delete all messages
            for (const msg of messages) {
                await ConversationDB.deleteMessage(msg.id);
            }

            messages = [];
            updateMessages();
        } catch (error) {
            console.error('Failed to clear conversation:', error);
            alert('Failed to clear conversation');
        }
    }

    // Update conversation title
    async function updateTitle(newTitle) {
        try {
            await ConversationDB.updateConversation(conversationId, {
                title: newTitle
            });
            conversation.title = newTitle;
        } catch (error) {
            console.error('Failed to update title:', error);
        }
    }

    // Change model
    async function changeModel(newModel) {
        try {
            await ConversationDB.updateConversation(conversationId, {
                model: newModel
            });
            conversation.model = newModel;
        } catch (error) {
            console.error('Failed to change model:', error);
        }
    }

    // Attach event listeners
    function attachEventListeners() {
        // Back button
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                Router.navigate('#/conversations');
            });
        }

        // Title input
        const titleInput = document.getElementById('conversation-title');
        if (titleInput) {
            let debounceTimer;
            titleInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    updateTitle(e.target.value);
                }, 500);
            });
        }

        // Model selector
        const modelSelector = document.getElementById('model-selector');
        if (modelSelector) {
            modelSelector.addEventListener('change', (e) => {
                changeModel(e.target.value);
            });
        }

        // Clear button
        const clearBtn = document.getElementById('clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', clearConversation);
        }

        // Send button
        const sendBtn = document.getElementById('send-btn');
        if (sendBtn) {
            sendBtn.addEventListener('click', sendMessage);
        }

        // Message input - send on Enter (Shift+Enter for new line)
        const input = document.getElementById('message-input');
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });

            // Auto-resize textarea
            input.addEventListener('input', () => {
                input.style.height = 'auto';
                input.style.height = Math.min(input.scrollHeight, 200) + 'px';
            });
        }

        // Image upload button
        const imageUploadBtn = document.getElementById('image-upload-btn');
        const imageFileInput = document.getElementById('image-file-input');
        if (imageUploadBtn && imageFileInput) {
            imageUploadBtn.addEventListener('click', () => {
                imageFileInput.click();
            });

            imageFileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    handleImageSelection(e.target.files);
                    e.target.value = ''; // Reset input
                }
            });
        }

        // Camera button
        const cameraBtn = document.getElementById('camera-btn');
        const cameraInput = document.getElementById('camera-input');
        if (cameraBtn && cameraInput) {
            cameraBtn.addEventListener('click', () => {
                cameraInput.click();
            });

            cameraInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    handleImageSelection(e.target.files);
                    e.target.value = ''; // Reset input
                }
            });
        }

        // Tools toggle
        const toolsToggle = document.getElementById('tools-toggle');
        if (toolsToggle) {
            toolsToggle.addEventListener('change', (e) => {
                enableTools = e.target.checked;
            });
        }
    }

    // Scroll messages to bottom
    function scrollToBottom() {
        const container = document.getElementById('messages-container');
        if (container) {
            setTimeout(() => {
                container.scrollTop = container.scrollHeight;
            }, 0);
        }
    }

    // Format message content (simple markdown-like formatting)
    function formatMessage(text) {
        if (!text) return '';

        // Escape HTML first
        text = escapeHtml(text);

        // Simple code blocks
        text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

        // Inline code
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Bold
        text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

        // Italic
        text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');

        // Line breaks
        text = text.replace(/\n/g, '<br>');

        return text;
    }

    // Format timestamp
    function formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Cleanup when leaving the page
    function destroy() {
        isGenerating = false;
        currentMessageId = null;
    }

    return {
        render,
        destroy
    };
})();
