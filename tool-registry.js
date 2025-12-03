/*
 * Tool Registry and Execution System
 * Manages client-side tools that can be called by LLMs
 */

const ToolRegistry = (function() {
    const tools = new Map();

    // Tool definition schema for Ollama
    const createToolSchema = (name, description, parameters) => ({
        type: 'function',
        function: {
            name,
            description,
            parameters
        }
    });

    // Register a tool
    const registerTool = (name, description, parameters, handler) => {
        tools.set(name, {
            schema: createToolSchema(name, description, parameters),
            handler
        });
    };

    // Execute a tool
    const executeTool = async (name, args) => {
        const tool = tools.get(name);
        if (!tool) {
            throw new Error(`Tool not found: ${name}`);
        }

        try {
            const result = await tool.handler(args);
            return {
                success: true,
                result
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    };

    // Get all tool schemas for API requests
    const getToolSchemas = () => {
        return Array.from(tools.values()).map(tool => tool.schema);
    };

    // Get tool by name
    const getTool = (name) => {
        return tools.get(name);
    };

    // Check if tools are registered
    const hasTools = () => {
        return tools.size > 0;
    };

    // ==========================================
    // Built-in Tools
    // ==========================================

    // Calculator tool
    registerTool(
        'calculate',
        'Performs mathematical calculations. Supports basic arithmetic, powers, square roots, and trigonometric functions.',
        {
            type: 'object',
            properties: {
                expression: {
                    type: 'string',
                    description: 'Mathematical expression to evaluate (e.g., "2 + 2", "sqrt(16)", "sin(PI/2)")'
                }
            },
            required: ['expression']
        },
        async (args) => {
            const { expression } = args;

            // Safe eval using Function constructor with limited scope
            const allowedFunctions = {
                sqrt: Math.sqrt,
                pow: Math.pow,
                sin: Math.sin,
                cos: Math.cos,
                tan: Math.tan,
                abs: Math.abs,
                floor: Math.floor,
                ceil: Math.ceil,
                round: Math.round,
                PI: Math.PI,
                E: Math.E
            };

            try {
                // Create a safe evaluation context
                const func = new Function(...Object.keys(allowedFunctions), `return ${expression}`);
                const result = func(...Object.values(allowedFunctions));

                return {
                    expression,
                    result,
                    formatted: `${expression} = ${result}`
                };
            } catch (error) {
                throw new Error(`Invalid expression: ${error.message}`);
            }
        }
    );

    // Get current time/date
    registerTool(
        'get_current_time',
        'Gets the current date and time in various formats.',
        {
            type: 'object',
            properties: {
                format: {
                    type: 'string',
                    enum: ['iso', 'locale', 'timestamp', 'date', 'time'],
                    description: 'Format of the time output'
                },
                timezone: {
                    type: 'string',
                    description: 'Timezone (optional, uses local timezone if not specified)'
                }
            },
            required: ['format']
        },
        async (args) => {
            const { format, timezone } = args;
            const now = new Date();

            const options = timezone ? { timeZone: timezone } : {};

            let result;
            switch (format) {
                case 'iso':
                    result = now.toISOString();
                    break;
                case 'locale':
                    result = now.toLocaleString(undefined, options);
                    break;
                case 'timestamp':
                    result = now.getTime();
                    break;
                case 'date':
                    result = now.toLocaleDateString(undefined, options);
                    break;
                case 'time':
                    result = now.toLocaleTimeString(undefined, options);
                    break;
                default:
                    result = now.toString();
            }

            return {
                format,
                timezone: timezone || 'local',
                result
            };
        }
    );

    // Web search (using DuckDuckGo Instant Answer API)
    registerTool(
        'web_search',
        'Searches the web for information using DuckDuckGo.',
        {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'Search query'
                }
            },
            required: ['query']
        },
        async (args) => {
            const { query } = args;

            try {
                // Use DuckDuckGo Instant Answer API (JSONP)
                const response = await fetch(
                    `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1`
                );
                const data = await response.json();

                const results = {
                    query,
                    abstract: data.Abstract || 'No abstract available',
                    abstractSource: data.AbstractSource || '',
                    abstractURL: data.AbstractURL || '',
                    relatedTopics: (data.RelatedTopics || []).slice(0, 5).map(topic => ({
                        text: topic.Text || '',
                        url: topic.FirstURL || ''
                    }))
                };

                return results;
            } catch (error) {
                throw new Error(`Web search failed: ${error.message}`);
            }
        }
    );

    // Random number generator
    registerTool(
        'random_number',
        'Generates a random number within a specified range.',
        {
            type: 'object',
            properties: {
                min: {
                    type: 'number',
                    description: 'Minimum value (inclusive)'
                },
                max: {
                    type: 'number',
                    description: 'Maximum value (inclusive)'
                },
                integer: {
                    type: 'boolean',
                    description: 'Whether to return an integer (default: true)'
                }
            },
            required: ['min', 'max']
        },
        async (args) => {
            const { min, max, integer = true } = args;

            const random = Math.random() * (max - min) + min;
            const result = integer ? Math.floor(random) : random;

            return {
                min,
                max,
                integer,
                result
            };
        }
    );

    // Encode/decode base64
    registerTool(
        'base64_encode_decode',
        'Encodes or decodes text using base64.',
        {
            type: 'object',
            properties: {
                operation: {
                    type: 'string',
                    enum: ['encode', 'decode'],
                    description: 'Whether to encode or decode'
                },
                text: {
                    type: 'string',
                    description: 'Text to encode or decode'
                }
            },
            required: ['operation', 'text']
        },
        async (args) => {
            const { operation, text } = args;

            let result;
            try {
                if (operation === 'encode') {
                    result = btoa(text);
                } else {
                    result = atob(text);
                }
            } catch (error) {
                throw new Error(`${operation} failed: ${error.message}`);
            }

            return {
                operation,
                input: text,
                output: result
            };
        }
    );

    // Get knowledge base info (integration with existing KB system)
    registerTool(
        'search_knowledge_base',
        'Searches the local knowledge bases for information.',
        {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'Search query'
                },
                knowledgeBaseId: {
                    type: 'number',
                    description: 'Specific knowledge base ID to search (optional)'
                }
            },
            required: ['query']
        },
        async (args) => {
            const { query, knowledgeBaseId } = args;

            try {
                if (typeof KnowledgeBaseDB === 'undefined') {
                    throw new Error('Knowledge base system not available');
                }

                let results = [];

                if (knowledgeBaseId) {
                    // Search specific KB
                    const docs = await KnowledgeBaseDB.searchDocuments(knowledgeBaseId, query);
                    results = docs.slice(0, 5).map(doc => ({
                        knowledgeBaseId: doc.knowledgeBaseId,
                        name: doc.name,
                        content: doc.content.substring(0, 500) + (doc.content.length > 500 ? '...' : ''),
                        type: doc.type
                    }));
                } else {
                    // Search all KBs
                    const kbs = await KnowledgeBaseDB.getAllKnowledgeBases();
                    for (const kb of kbs) {
                        const docs = await KnowledgeBaseDB.searchDocuments(kb.id, query);
                        results.push(...docs.slice(0, 2).map(doc => ({
                            knowledgeBaseName: kb.name,
                            knowledgeBaseId: kb.id,
                            name: doc.name,
                            content: doc.content.substring(0, 300) + (doc.content.length > 300 ? '...' : ''),
                            type: doc.type
                        })));
                    }
                }

                return {
                    query,
                    resultsFound: results.length,
                    results
                };
            } catch (error) {
                throw new Error(`Knowledge base search failed: ${error.message}`);
            }
        }
    );

    // Public API
    return {
        registerTool,
        executeTool,
        getToolSchemas,
        getTool,
        hasTools
    };
})();
