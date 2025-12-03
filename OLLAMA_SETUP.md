# Ollama WebSocket Proxy - Setup Guide

This application now supports AI conversations through the Ollama API using a WebSocket proxy architecture.

## Architecture

The implementation uses a **client-side focused architecture** where:
- **Server**: Acts as a "dumb proxy" forwarding WebSocket messages to Ollama API
- **Client**: Handles all conversation logic, UI, and state management

```
┌─────────────┐   WebSocket   ┌─────────────┐   HTTP/Streaming   ┌─────────────┐
│   Browser   │ ◄──────────► │   Express   │ ◄──────────────► │   Ollama    │
│   Client    │               │    Proxy    │                   │     API     │
└─────────────┘               └─────────────┘                   └─────────────┘
```

## Prerequisites

1. **Node.js** (v14 or higher)
2. **Ollama** installed and running locally

### Installing Ollama

**macOS:**
```bash
brew install ollama
ollama serve
```

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama serve
```

**Windows:**
Download from https://ollama.com/download

### Pull a Model

Before using the conversation interface, download at least one model:

```bash
# Pull a text model (recommended for testing)
ollama pull llama2

# Or pull a larger text model
ollama pull llama3.2
ollama pull mistral

# Pull a vision model (for image support)
ollama pull llava
ollama pull llava:13b
```

**Note**: To use image features, you need a vision-capable model like `llava`. Text-only models will ignore images.

## Running the Application

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

   The server will start on `http://localhost:8080`

3. **Configure Ollama endpoint (optional):**

   By default, the proxy connects to `http://localhost:11434`

   To use a different Ollama instance, set environment variables:
   ```bash
   OLLAMA_HOST=192.168.1.100 OLLAMA_PORT=11434 npm start
   ```

## Using the Conversation Interface

1. Navigate to `http://localhost:8080/#/conversations`
2. Click "New Conversation"
3. Select a model from the dropdown
4. Start chatting!

## Features

### Conversation Management
- Create multiple conversations
- Switch between conversations
- Delete conversations
- Auto-save all messages to IndexedDB

### Chat Interface
- Real-time streaming responses
- Markdown formatting (code blocks, bold, italic)
- Message history
- Editable conversation titles
- Model selection per conversation

### 🆕 Tools/Function Calling
- **Built-in Tools**:
  - 🧮 **calculate** - Evaluate mathematical expressions
  - ⏰ **get_current_time** - Get current date/time in various formats
  - 🔍 **web_search** - Search the web using DuckDuckGo
  - 🎲 **random_number** - Generate random numbers
  - 🔐 **base64_encode_decode** - Base64 encoding/decoding
  - 📚 **search_knowledge_base** - Search local knowledge bases
- Client-side tool execution
- Automatic tool call detection and handling
- Visual display of tool usage in chat
- Enable/disable tools per conversation with checkbox

### 🆕 Image/Camera Support
- Upload images from device (multiple files supported)
- Capture photos using device camera
- Image preview with remove capability
- Images sent to vision-capable models (e.g., llava)
- Images stored in conversation history
- Visual display of images in messages

### Connection Status
- Visual indicator showing connection state
- Auto-reconnect on disconnect
- Error handling and notifications

## WebSocket Protocol

The proxy supports three message types:

### 1. Chat Request
```json
{
  "type": "chat",
  "payload": {
    "model": "llama2",
    "messages": [
      { "role": "user", "content": "Hello!" },
      { "role": "assistant", "content": "Hi there!" }
    ],
    "options": {},
    "stream": true
  }
}
```

### 2. Generate Request
```json
{
  "type": "generate",
  "payload": {
    "model": "llama2",
    "prompt": "Write a poem",
    "options": {},
    "stream": true
  }
}
```

### 3. Models List Request
```json
{
  "type": "models",
  "payload": {}
}
```

## Client-Side Modules

- **conversation-db.js**: IndexedDB layer for storing conversations and messages
- **ollama-service.js**: WebSocket client with reconnection logic
- **conversations.js**: Conversations gallery view
- **conversation-detail.js**: Chat interface
- **server.js**: Express server with WebSocket proxy

## Storage

All conversations are stored locally in IndexedDB under:
- Database: `ConversationDB`
- Stores: `conversations`, `messages`

No data is sent to external servers except the configured Ollama instance.

## Using Tools and Images

### Using Tools

Tools are enabled by default. The model can automatically call tools when needed:

1. **Ask questions that require tools**:
   - "What's 25 * 48?" → Uses `calculate` tool
   - "What time is it in Tokyo?" → Uses `get_current_time` tool
   - "Search for information about quantum computing" → Uses `web_search` tool
   - "Give me a random number between 1 and 100" → Uses `random_number` tool

2. **Tool execution is automatic**:
   - Model decides when to use tools
   - Tool calls are displayed in chat with JSON arguments
   - Results are shown and sent back to the model
   - Model continues conversation with tool results

3. **Disable tools** (optional):
   - Uncheck the "Tools" checkbox in the conversation interface
   - Useful for pure text generation tasks

### Using Images

To use images with vision models:

1. **Upload images**:
   - Click the 📷 camera button to select from device
   - Click the 📸 photo button to capture with camera
   - Select multiple images at once

2. **Preview and remove**:
   - Images appear as thumbnails above input
   - Click ✕ on any thumbnail to remove

3. **Send with message**:
   - Type your question about the image
   - Images are sent along with your message
   - Works best with vision models like `llava`

4. **Example prompts**:
   - "What's in this image?"
   - "Describe this photo in detail"
   - "What text can you see in this image?"
   - "Compare these two images"

### Adding Custom Tools

To add your own tools, edit `tool-registry.js`:

```javascript
ToolRegistry.registerTool(
    'my_custom_tool',
    'Description of what this tool does',
    {
        type: 'object',
        properties: {
            param1: {
                type: 'string',
                description: 'Parameter description'
            }
        },
        required: ['param1']
    },
    async (args) => {
        // Your tool implementation
        return { result: 'success' };
    }
);
```

## Troubleshooting

### Connection Issues

**"Disconnected" status:**
- Verify Ollama is running: `ollama list`
- Check Ollama is accessible: `curl http://localhost:11434/api/tags`
- Restart Ollama: `ollama serve`

**"No models available":**
- Pull a model: `ollama pull llama2`
- Verify models: `ollama list`

### Server Issues

**Port already in use:**
```bash
PORT=3000 npm start
```

**WebSocket connection failed:**
- Check browser console for errors
- Verify the server is running
- Check firewall settings

## Development

To run in development mode with auto-reload:

```bash
# Terminal 1: Start server
npm start

# Terminal 2: Watch for changes (optional)
# Use your preferred file watcher
```

## Production Deployment

For production, you'll need to:
1. Update nginx configuration to proxy WebSocket connections
2. Set up SSL/TLS for secure WebSocket (wss://)
3. Configure environment variables for Ollama endpoint
4. Build/minify client-side assets (optional)

Example nginx config:
```nginx
location /ws/ollama {
    proxy_pass http://localhost:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

## Future Enhancements

Potential additions for this architecture:
- Support for other API providers (OpenAI, Anthropic, etc.)
- Conversation export/import
- System prompts and parameters
- Token usage tracking
- Conversation search
- Multi-model comparison

## License

GPL-3.0 (same as parent project)
