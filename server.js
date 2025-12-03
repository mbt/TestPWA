const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const https = require('https');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Configuration for Ollama endpoint
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'localhost';
const OLLAMA_PORT = process.env.OLLAMA_PORT || 11434;
const OLLAMA_PROTOCOL = process.env.OLLAMA_PROTOCOL || 'http';

// Serve static files from the current directory
app.use(express.static(__dirname, {
    setHeaders: (res, filepath) => {
        // Cache control headers similar to nginx config
        if (filepath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
        } else if (filepath.endsWith('.js') || filepath.endsWith('.css')) {
            res.setHeader('Cache-Control', 'public, max-age=604800'); // 7 days
        } else if (filepath.endsWith('sw.js')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }

        // Security headers
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-XSS-Protection', '1; mode=block');
    }
}));

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({
    server,
    path: '/ws/ollama'
});

// WebSocket connection handler
wss.on('connection', (ws, req) => {
    console.log(`[WebSocket] New client connected from ${req.socket.remoteAddress}`);

    ws.on('message', async (data) => {
        try {
            const message = JSON.parse(data.toString());
            console.log(`[WebSocket] Received message type: ${message.type}`);

            // Handle different message types
            switch (message.type) {
                case 'chat':
                    await handleChatRequest(ws, message);
                    break;
                case 'generate':
                    await handleGenerateRequest(ws, message);
                    break;
                case 'models':
                    await handleModelsRequest(ws, message);
                    break;
                default:
                    ws.send(JSON.stringify({
                        type: 'error',
                        error: `Unknown message type: ${message.type}`
                    }));
            }
        } catch (error) {
            console.error('[WebSocket] Error processing message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                error: error.message
            }));
        }
    });

    ws.on('close', () => {
        console.log('[WebSocket] Client disconnected');
    });

    ws.on('error', (error) => {
        console.error('[WebSocket] Error:', error);
    });
});

/**
 * Handle chat requests - proxies to Ollama's /api/chat endpoint
 */
async function handleChatRequest(ws, message) {
    const { model, messages, options, stream = true } = message.payload;

    const requestData = JSON.stringify({
        model: model || 'llama2',
        messages: messages || [],
        stream: stream,
        options: options || {}
    });

    const requestOptions = {
        hostname: OLLAMA_HOST,
        port: OLLAMA_PORT,
        path: '/api/chat',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestData)
        }
    };

    const httpModule = OLLAMA_PROTOCOL === 'https' ? https : http;

    const req = httpModule.request(requestOptions, (res) => {
        console.log(`[Ollama] Response status: ${res.statusCode}`);

        res.on('data', (chunk) => {
            try {
                // Ollama streams newline-delimited JSON
                const lines = chunk.toString().split('\n').filter(line => line.trim());

                for (const line of lines) {
                    const data = JSON.parse(line);

                    // Forward the response to the client
                    ws.send(JSON.stringify({
                        type: 'chat_response',
                        payload: data
                    }));
                }
            } catch (error) {
                console.error('[Ollama] Error parsing chunk:', error);
            }
        });

        res.on('end', () => {
            console.log('[Ollama] Request completed');
            ws.send(JSON.stringify({
                type: 'chat_complete',
                payload: { done: true }
            }));
        });
    });

    req.on('error', (error) => {
        console.error('[Ollama] Request error:', error);
        ws.send(JSON.stringify({
            type: 'error',
            error: `Ollama request failed: ${error.message}`
        }));
    });

    req.write(requestData);
    req.end();
}

/**
 * Handle generate requests - proxies to Ollama's /api/generate endpoint
 */
async function handleGenerateRequest(ws, message) {
    const { model, prompt, options, stream = true } = message.payload;

    const requestData = JSON.stringify({
        model: model || 'llama2',
        prompt: prompt || '',
        stream: stream,
        options: options || {}
    });

    const requestOptions = {
        hostname: OLLAMA_HOST,
        port: OLLAMA_PORT,
        path: '/api/generate',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestData)
        }
    };

    const httpModule = OLLAMA_PROTOCOL === 'https' ? https : http;

    const req = httpModule.request(requestOptions, (res) => {
        console.log(`[Ollama] Response status: ${res.statusCode}`);

        res.on('data', (chunk) => {
            try {
                // Ollama streams newline-delimited JSON
                const lines = chunk.toString().split('\n').filter(line => line.trim());

                for (const line of lines) {
                    const data = JSON.parse(line);

                    // Forward the response to the client
                    ws.send(JSON.stringify({
                        type: 'generate_response',
                        payload: data
                    }));
                }
            } catch (error) {
                console.error('[Ollama] Error parsing chunk:', error);
            }
        });

        res.on('end', () => {
            console.log('[Ollama] Request completed');
            ws.send(JSON.stringify({
                type: 'generate_complete',
                payload: { done: true }
            }));
        });
    });

    req.on('error', (error) => {
        console.error('[Ollama] Request error:', error);
        ws.send(JSON.stringify({
            type: 'error',
            error: `Ollama request failed: ${error.message}`
        }));
    });

    req.write(requestData);
    req.end();
}

/**
 * Handle models list request - proxies to Ollama's /api/tags endpoint
 */
async function handleModelsRequest(ws, message) {
    const requestOptions = {
        hostname: OLLAMA_HOST,
        port: OLLAMA_PORT,
        path: '/api/tags',
        method: 'GET'
    };

    const httpModule = OLLAMA_PROTOCOL === 'https' ? https : http;

    const req = httpModule.request(requestOptions, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const models = JSON.parse(data);
                ws.send(JSON.stringify({
                    type: 'models_response',
                    payload: models
                }));
            } catch (error) {
                console.error('[Ollama] Error parsing models response:', error);
                ws.send(JSON.stringify({
                    type: 'error',
                    error: 'Failed to parse models list'
                }));
            }
        });
    });

    req.on('error', (error) => {
        console.error('[Ollama] Models request error:', error);
        ws.send(JSON.stringify({
            type: 'error',
            error: `Failed to fetch models: ${error.message}`
        }));
    });

    req.end();
}

// Start server
server.listen(PORT, () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
    console.log(`[Server] WebSocket endpoint: ws://localhost:${PORT}/ws/ollama`);
    console.log(`[Server] Proxying to Ollama at ${OLLAMA_PROTOCOL}://${OLLAMA_HOST}:${OLLAMA_PORT}`);
});
