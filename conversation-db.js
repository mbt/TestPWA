/*
 * Conversation Database Layer
 * Manages IndexedDB storage for LLM conversations and messages
 */

const ConversationDB = (function() {
    const DB_NAME = 'ConversationDB';
    const DB_VERSION = 1;
    const CONV_STORE = 'conversations';
    const MSG_STORE = 'messages';

    let db = null;

    // Initialize the database
    const init = () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('ConversationDB failed to open:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                db = request.result;
                console.log('ConversationDB opened successfully');
                resolve(db);
            };

            request.onupgradeneeded = (event) => {
                db = event.target.result;
                console.log('ConversationDB upgrade needed');

                // Create conversations object store
                if (!db.objectStoreNames.contains(CONV_STORE)) {
                    const convStore = db.createObjectStore(CONV_STORE, { keyPath: 'id', autoIncrement: true });
                    convStore.createIndex('title', 'title', { unique: false });
                    convStore.createIndex('model', 'model', { unique: false });
                    convStore.createIndex('dateCreated', 'dateCreated', { unique: false });
                    convStore.createIndex('dateModified', 'dateModified', { unique: false });
                }

                // Create messages object store
                if (!db.objectStoreNames.contains(MSG_STORE)) {
                    const msgStore = db.createObjectStore(MSG_STORE, { keyPath: 'id', autoIncrement: true });
                    msgStore.createIndex('conversationId', 'conversationId', { unique: false });
                    msgStore.createIndex('role', 'role', { unique: false });
                    msgStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    };

    // Ensure database is initialized
    const ensureDB = async () => {
        if (!db) {
            await init();
        }
        return db;
    };

    // Conversation CRUD operations
    const createConversation = async (conversation) => {
        await ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([CONV_STORE], 'readwrite');
            const store = transaction.objectStore(CONV_STORE);

            const conv = {
                title: conversation.title || 'New Conversation',
                model: conversation.model || 'llama2',
                provider: conversation.provider || 'ollama',
                dateCreated: new Date().toISOString(),
                dateModified: new Date().toISOString(),
                messageCount: 0,
                metadata: conversation.metadata || {}
            };

            const request = store.add(conv);

            request.onsuccess = () => {
                conv.id = request.result;
                resolve(conv);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    };

    const getConversation = async (id) => {
        await ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([CONV_STORE], 'readonly');
            const store = transaction.objectStore(CONV_STORE);
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    };

    const getAllConversations = async () => {
        await ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([CONV_STORE], 'readonly');
            const store = transaction.objectStore(CONV_STORE);
            const request = store.getAll();

            request.onsuccess = () => {
                // Sort by date modified (most recent first)
                const conversations = request.result.sort((a, b) =>
                    new Date(b.dateModified) - new Date(a.dateModified)
                );
                resolve(conversations);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    };

    const updateConversation = async (id, updates) => {
        await ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([CONV_STORE], 'readwrite');
            const store = transaction.objectStore(CONV_STORE);
            const getRequest = store.get(id);

            getRequest.onsuccess = () => {
                const conversation = getRequest.result;
                if (!conversation) {
                    reject(new Error('Conversation not found'));
                    return;
                }

                // Update fields
                Object.assign(conversation, updates);
                conversation.dateModified = new Date().toISOString();

                const updateRequest = store.put(conversation);

                updateRequest.onsuccess = () => {
                    resolve(conversation);
                };

                updateRequest.onerror = () => {
                    reject(updateRequest.error);
                };
            };

            getRequest.onerror = () => {
                reject(getRequest.error);
            };
        });
    };

    const deleteConversation = async (id) => {
        await ensureDB();
        return new Promise(async (resolve, reject) => {
            try {
                // First delete all messages in this conversation
                await deleteMessagesByConversationId(id);

                // Then delete the conversation itself
                const transaction = db.transaction([CONV_STORE], 'readwrite');
                const store = transaction.objectStore(CONV_STORE);
                const request = store.delete(id);

                request.onsuccess = () => {
                    resolve(true);
                };

                request.onerror = () => {
                    reject(request.error);
                };
            } catch (error) {
                reject(error);
            }
        });
    };

    // Message CRUD operations
    const addMessage = async (conversationId, message) => {
        await ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([MSG_STORE, CONV_STORE], 'readwrite');
            const msgStore = transaction.objectStore(MSG_STORE);
            const convStore = transaction.objectStore(CONV_STORE);

            const msg = {
                conversationId: conversationId,
                role: message.role || 'user', // 'user' or 'assistant'
                content: message.content || '',
                timestamp: new Date().toISOString(),
                metadata: message.metadata || {}
            };

            const msgRequest = msgStore.add(msg);

            msgRequest.onsuccess = () => {
                msg.id = msgRequest.result;

                // Update conversation message count
                const convRequest = convStore.get(conversationId);
                convRequest.onsuccess = () => {
                    const conversation = convRequest.result;
                    if (conversation) {
                        conversation.messageCount = (conversation.messageCount || 0) + 1;
                        conversation.dateModified = new Date().toISOString();
                        convStore.put(conversation);
                    }
                };

                resolve(msg);
            };

            msgRequest.onerror = () => {
                reject(msgRequest.error);
            };
        });
    };

    const getMessages = async (conversationId) => {
        await ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([MSG_STORE], 'readonly');
            const store = transaction.objectStore(MSG_STORE);
            const index = store.index('conversationId');
            const request = index.getAll(conversationId);

            request.onsuccess = () => {
                // Sort by timestamp (oldest first)
                const messages = request.result.sort((a, b) =>
                    new Date(a.timestamp) - new Date(b.timestamp)
                );
                resolve(messages);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    };

    const deleteMessage = async (id) => {
        await ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([MSG_STORE, CONV_STORE], 'readwrite');
            const msgStore = transaction.objectStore(MSG_STORE);

            // Get the message first to find the conversationId
            const getRequest = msgStore.get(id);

            getRequest.onsuccess = () => {
                const message = getRequest.result;
                if (!message) {
                    reject(new Error('Message not found'));
                    return;
                }

                const conversationId = message.conversationId;

                // Delete the message
                const deleteRequest = msgStore.delete(id);

                deleteRequest.onsuccess = () => {
                    // Update conversation message count
                    const convStore = transaction.objectStore(CONV_STORE);
                    const convRequest = convStore.get(conversationId);

                    convRequest.onsuccess = () => {
                        const conversation = convRequest.result;
                        if (conversation) {
                            conversation.messageCount = Math.max(0, (conversation.messageCount || 0) - 1);
                            conversation.dateModified = new Date().toISOString();
                            convStore.put(conversation);
                        }
                    };

                    resolve(true);
                };

                deleteRequest.onerror = () => {
                    reject(deleteRequest.error);
                };
            };

            getRequest.onerror = () => {
                reject(getRequest.error);
            };
        });
    };

    const deleteMessagesByConversationId = async (conversationId) => {
        await ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([MSG_STORE], 'readwrite');
            const store = transaction.objectStore(MSG_STORE);
            const index = store.index('conversationId');
            const request = index.openCursor(conversationId);

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    resolve(true);
                }
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    };

    // Update message content (useful for streaming updates)
    const updateMessage = async (id, updates) => {
        await ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([MSG_STORE], 'readwrite');
            const store = transaction.objectStore(MSG_STORE);
            const getRequest = store.get(id);

            getRequest.onsuccess = () => {
                const message = getRequest.result;
                if (!message) {
                    reject(new Error('Message not found'));
                    return;
                }

                // Update fields
                Object.assign(message, updates);

                const updateRequest = store.put(message);

                updateRequest.onsuccess = () => {
                    resolve(message);
                };

                updateRequest.onerror = () => {
                    reject(updateRequest.error);
                };
            };

            getRequest.onerror = () => {
                reject(getRequest.error);
            };
        });
    };

    // Get conversation with messages
    const getConversationWithMessages = async (id) => {
        await ensureDB();
        const conversation = await getConversation(id);
        if (!conversation) {
            return null;
        }
        const messages = await getMessages(id);
        return {
            ...conversation,
            messages
        };
    };

    // Search conversations by title or model
    const searchConversations = async (query) => {
        await ensureDB();
        const allConversations = await getAllConversations();
        const lowerQuery = query.toLowerCase();

        return allConversations.filter(conv =>
            conv.title.toLowerCase().includes(lowerQuery) ||
            conv.model.toLowerCase().includes(lowerQuery)
        );
    };

    // Public API
    return {
        init,
        // Conversation operations
        createConversation,
        getConversation,
        getAllConversations,
        updateConversation,
        deleteConversation,
        getConversationWithMessages,
        searchConversations,
        // Message operations
        addMessage,
        getMessages,
        updateMessage,
        deleteMessage
    };
})();
