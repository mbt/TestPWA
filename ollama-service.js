/*
 * Ollama WebSocket Service
 * Client-side service for communicating with Ollama via WebSocket proxy
 */

const OllamaService = (function() {
    let ws = null;
    let reconnectAttempts = 0;
    let maxReconnectAttempts = 5;
    let reconnectDelay = 1000;
    let isConnecting = false;
    let messageHandlers = new Map();
    let eventHandlers = {
        connected: [],
        disconnected: [],
        error: [],
        modelsList: []
    };

    // Get WebSocket URL (handle both http and https)
    const getWebSocketUrl = () => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        return `${protocol}//${host}/ws/ollama`;
    };

    // Connect to WebSocket server
    const connect = () => {
        return new Promise((resolve, reject) => {
            if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
                resolve(ws);
                return;
            }

            if (isConnecting) {
                reject(new Error('Already attempting to connect'));
                return;
            }

            isConnecting = true;
            const url = getWebSocketUrl();
            console.log('[OllamaService] Connecting to', url);

            try {
                ws = new WebSocket(url);

                ws.onopen = () => {
                    console.log('[OllamaService] Connected');
                    isConnecting = false;
                    reconnectAttempts = 0;
                    notifyEventHandlers('connected');
                    resolve(ws);
                };

                ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        console.log('[OllamaService] <<<< RECEIVED FROM SERVER:', JSON.stringify(message, null, 2));
                        handleMessage(message);
                    } catch (error) {
                        console.error('[OllamaService] Error parsing message:', error);
                    }
                };

                ws.onerror = (error) => {
                    console.error('[OllamaService] WebSocket error:', error);
                    isConnecting = false;
                    notifyEventHandlers('error', error);
                };

                ws.onclose = (event) => {
                    console.log('[OllamaService] Disconnected:', event.code, event.reason);
                    isConnecting = false;
                    ws = null;
                    notifyEventHandlers('disconnected', event);

                    // Attempt to reconnect
                    if (reconnectAttempts < maxReconnectAttempts) {
                        const delay = reconnectDelay * Math.pow(2, reconnectAttempts);
                        reconnectAttempts++;
                        console.log(`[OllamaService] Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
                        setTimeout(() => connect(), delay);
                    }
                };
            } catch (error) {
                isConnecting = false;
                reject(error);
            }
        });
    };

    // Disconnect from WebSocket server
    const disconnect = () => {
        if (ws) {
            reconnectAttempts = maxReconnectAttempts; // Prevent auto-reconnect
            ws.close();
            ws = null;
        }
    };

    // Handle incoming messages
    const handleMessage = (message) => {
        console.log('[OllamaService] Received:', message.type);

        switch (message.type) {
            case 'chat_response':
            case 'chat_complete':
                notifyMessageHandlers('chat', message);
                break;
            case 'generate_response':
            case 'generate_complete':
                notifyMessageHandlers('generate', message);
                break;
            case 'models_response':
                notifyEventHandlers('modelsList', message.payload);
                break;
            case 'error':
                console.error('[OllamaService] Server error:', message.error);
                notifyEventHandlers('error', new Error(message.error));
                break;
            default:
                console.warn('[OllamaService] Unknown message type:', message.type);
        }
    };

    // Send a message to the server
    const sendMessage = async (message) => {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            await connect();
        }

        return new Promise((resolve, reject) => {
            try {
                console.log('[OllamaService] >>>> SENDING TO SERVER:', JSON.stringify(message, null, 2));
                ws.send(JSON.stringify(message));
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    };

    // Register a message handler for a specific request type
    const registerMessageHandler = (requestType, handler) => {
        if (!messageHandlers.has(requestType)) {
            messageHandlers.set(requestType, []);
        }
        messageHandlers.get(requestType).push(handler);

        // Return unsubscribe function
        return () => {
            const handlers = messageHandlers.get(requestType);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        };
    };

    // Notify all registered message handlers
    const notifyMessageHandlers = (requestType, message) => {
        const handlers = messageHandlers.get(requestType) || [];
        handlers.forEach(handler => {
            try {
                handler(message);
            } catch (error) {
                console.error('[OllamaService] Error in message handler:', error);
            }
        });
    };

    // Register an event handler
    const on = (event, handler) => {
        if (eventHandlers[event]) {
            eventHandlers[event].push(handler);
        }

        // Return unsubscribe function
        return () => {
            const handlers = eventHandlers[event];
            if (handlers) {
                const index = handlers.indexOf(handler);
                if (index > -1) {
                    handlers.splice(index, 1);
                }
            }
        };
    };

    // Notify all event handlers
    const notifyEventHandlers = (event, data) => {
        const handlers = eventHandlers[event] || [];
        handlers.forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error('[OllamaService] Error in event handler:', error);
            }
        });
    };

    // Send a chat request
    const chat = async (model, messages, options = {}, onChunk = null, tools = null, format = null) => {
        const payload = {
            model,
            messages,
            options,
            stream: true
        };

        // Add tools if provided
        if (tools && tools.length > 0) {
            payload.tools = tools;
        }

        // Add format if provided
        if (format) {
            payload.format = format;
        }

        await sendMessage({
            type: 'chat',
            payload
        });

        // Register handler for responses
        let fullResponse = '';
        let toolCalls = [];

        const unsubscribe = registerMessageHandler('chat', (message) => {
            if (message.type === 'chat_response') {
                const chunk = message.payload;
                console.log('[OllamaService] Processing chat chunk:', {
                    hasContent: !!(chunk.message && chunk.message.content),
                    hasToolCalls: !!(chunk.message && chunk.message.tool_calls),
                    chunk: chunk
                });

                // Handle text content
                if (chunk.message && chunk.message.content) {
                    fullResponse += chunk.message.content;
                    console.log('[OllamaService] Accumulated text length:', fullResponse.length);
                }

                // Handle tool calls
                if (chunk.message && chunk.message.tool_calls) {
                    toolCalls = chunk.message.tool_calls;
                    console.log('[OllamaService] Tool calls received:', JSON.stringify(toolCalls, null, 2));
                }

                if (onChunk) {
                    onChunk(chunk, fullResponse, false, toolCalls);
                }
            } else if (message.type === 'chat_complete') {
                console.log('[OllamaService] Chat complete. Final response length:', fullResponse.length, 'Tool calls:', toolCalls.length);
                unsubscribe();
                if (onChunk) {
                    onChunk(message.payload, fullResponse, true, toolCalls);
                }
            }
        });
    };

    // Send a generate request (single prompt)
    const generate = async (model, prompt, options = {}, onChunk = null) => {
        await sendMessage({
            type: 'generate',
            payload: {
                model,
                prompt,
                options,
                stream: true
            }
        });

        // Register handler for responses
        let fullResponse = '';
        const unsubscribe = registerMessageHandler('generate', (message) => {
            if (message.type === 'generate_response') {
                const chunk = message.payload;
                if (chunk.response) {
                    fullResponse += chunk.response;
                    if (onChunk) {
                        onChunk(chunk, fullResponse);
                    }
                }
            } else if (message.type === 'generate_complete') {
                unsubscribe();
                if (onChunk) {
                    onChunk(message.payload, fullResponse, true);
                }
            }
        });
    };

    // Get list of available models
    const getModels = async () => {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                unsubscribe();
                reject(new Error('Models request timeout'));
            }, 10000);

            const unsubscribe = on('modelsList', (models) => {
                clearTimeout(timeout);
                unsubscribe();
                resolve(models);
            });

            sendMessage({
                type: 'models',
                payload: {}
            }).catch(reject);
        });
    };

    // Check if connected
    const isConnected = () => {
        return ws !== null && ws.readyState === WebSocket.OPEN;
    };

    // Get connection state
    const getState = () => {
        if (!ws) return 'disconnected';
        switch (ws.readyState) {
            case WebSocket.CONNECTING:
                return 'connecting';
            case WebSocket.OPEN:
                return 'connected';
            case WebSocket.CLOSING:
                return 'closing';
            case WebSocket.CLOSED:
                return 'disconnected';
            default:
                return 'unknown';
        }
    };

    // Public API
    return {
        connect,
        disconnect,
        chat,
        generate,
        getModels,
        isConnected,
        getState,
        on
    };
})();
