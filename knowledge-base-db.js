/*
 * Knowledge Base Database Layer
 * Manages IndexedDB storage for knowledge bases and documents
 */

const KnowledgeBaseDB = (function() {
    const DB_NAME = 'KnowledgeBaseDB';
    const DB_VERSION = 1;
    const KB_STORE = 'knowledgeBases';
    const DOC_STORE = 'documents';

    let db = null;

    // Initialize the database
    const init = () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('Database failed to open:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                db = request.result;
                console.log('Database opened successfully');
                resolve(db);
            };

            request.onupgradeneeded = (event) => {
                db = event.target.result;
                console.log('Database upgrade needed');

                // Create knowledge bases object store
                if (!db.objectStoreNames.contains(KB_STORE)) {
                    const kbStore = db.createObjectStore(KB_STORE, { keyPath: 'id', autoIncrement: true });
                    kbStore.createIndex('name', 'name', { unique: false });
                    kbStore.createIndex('dateCreated', 'dateCreated', { unique: false });
                    kbStore.createIndex('dateModified', 'dateModified', { unique: false });
                }

                // Create documents object store
                if (!db.objectStoreNames.contains(DOC_STORE)) {
                    const docStore = db.createObjectStore(DOC_STORE, { keyPath: 'id', autoIncrement: true });
                    docStore.createIndex('knowledgeBaseId', 'knowledgeBaseId', { unique: false });
                    docStore.createIndex('name', 'name', { unique: false });
                    docStore.createIndex('dateAdded', 'dateAdded', { unique: false });
                    docStore.createIndex('type', 'type', { unique: false });
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

    // Knowledge Base CRUD operations
    const createKnowledgeBase = async (knowledgeBase) => {
        await ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([KB_STORE], 'readwrite');
            const store = transaction.objectStore(KB_STORE);

            const kb = {
                name: knowledgeBase.name || 'Untitled Knowledge Base',
                description: knowledgeBase.description || '',
                tags: knowledgeBase.tags || [],
                dateCreated: new Date().toISOString(),
                dateModified: new Date().toISOString(),
                documentCount: 0,
                totalSize: 0
            };

            const request = store.add(kb);

            request.onsuccess = () => {
                kb.id = request.result;
                resolve(kb);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    };

    const getKnowledgeBase = async (id) => {
        await ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([KB_STORE], 'readonly');
            const store = transaction.objectStore(KB_STORE);
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    };

    const getAllKnowledgeBases = async () => {
        await ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([KB_STORE], 'readonly');
            const store = transaction.objectStore(KB_STORE);
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    };

    const updateKnowledgeBase = async (id, updates) => {
        await ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([KB_STORE], 'readwrite');
            const store = transaction.objectStore(KB_STORE);
            const getRequest = store.get(id);

            getRequest.onsuccess = () => {
                const kb = getRequest.result;
                if (!kb) {
                    reject(new Error('Knowledge base not found'));
                    return;
                }

                // Update fields
                Object.assign(kb, updates, { dateModified: new Date().toISOString() });

                const updateRequest = store.put(kb);
                updateRequest.onsuccess = () => {
                    resolve(kb);
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

    const deleteKnowledgeBase = async (id) => {
        await ensureDB();
        // First delete all associated documents
        const documents = await getDocumentsByKnowledgeBase(id);
        await Promise.all(documents.map(doc => deleteDocument(doc.id)));

        // Then delete the knowledge base
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([KB_STORE], 'readwrite');
            const store = transaction.objectStore(KB_STORE);
            const request = store.delete(id);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    };

    // Document CRUD operations
    const createDocument = async (document) => {
        await ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([DOC_STORE, KB_STORE], 'readwrite');
            const docStore = transaction.objectStore(DOC_STORE);
            const kbStore = transaction.objectStore(KB_STORE);

            const doc = {
                knowledgeBaseId: document.knowledgeBaseId,
                name: document.name || 'Untitled Document',
                content: document.content || '',
                type: document.type || 'text/plain',
                size: document.size || 0,
                tags: document.tags || [],
                dateAdded: new Date().toISOString(),
                dateModified: new Date().toISOString(),
                metadata: document.metadata || {}
            };

            const docRequest = docStore.add(doc);

            docRequest.onsuccess = () => {
                doc.id = docRequest.result;

                // Update knowledge base stats
                const kbRequest = kbStore.get(document.knowledgeBaseId);
                kbRequest.onsuccess = () => {
                    const kb = kbRequest.result;
                    if (kb) {
                        kb.documentCount = (kb.documentCount || 0) + 1;
                        kb.totalSize = (kb.totalSize || 0) + doc.size;
                        kb.dateModified = new Date().toISOString();
                        kbStore.put(kb);
                    }
                };

                resolve(doc);
            };

            docRequest.onerror = () => {
                reject(docRequest.error);
            };
        });
    };

    const getDocument = async (id) => {
        await ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([DOC_STORE], 'readonly');
            const store = transaction.objectStore(DOC_STORE);
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    };

    const getDocumentsByKnowledgeBase = async (knowledgeBaseId) => {
        await ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([DOC_STORE], 'readonly');
            const store = transaction.objectStore(DOC_STORE);
            const index = store.index('knowledgeBaseId');
            const request = index.getAll(knowledgeBaseId);

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    };

    const updateDocument = async (id, updates) => {
        await ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([DOC_STORE, KB_STORE], 'readwrite');
            const docStore = transaction.objectStore(DOC_STORE);
            const kbStore = transaction.objectStore(KB_STORE);
            const getRequest = docStore.get(id);

            getRequest.onsuccess = () => {
                const doc = getRequest.result;
                if (!doc) {
                    reject(new Error('Document not found'));
                    return;
                }

                const oldSize = doc.size;
                Object.assign(doc, updates, { dateModified: new Date().toISOString() });

                const updateRequest = docStore.put(doc);
                updateRequest.onsuccess = () => {
                    // Update knowledge base stats
                    const kbRequest = kbStore.get(doc.knowledgeBaseId);
                    kbRequest.onsuccess = () => {
                        const kb = kbRequest.result;
                        if (kb) {
                            kb.totalSize = (kb.totalSize || 0) - oldSize + doc.size;
                            kb.dateModified = new Date().toISOString();
                            kbStore.put(kb);
                        }
                    };

                    resolve(doc);
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

    const deleteDocument = async (id) => {
        await ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([DOC_STORE, KB_STORE], 'readwrite');
            const docStore = transaction.objectStore(DOC_STORE);
            const kbStore = transaction.objectStore(KB_STORE);
            const getRequest = docStore.get(id);

            getRequest.onsuccess = () => {
                const doc = getRequest.result;
                if (!doc) {
                    reject(new Error('Document not found'));
                    return;
                }

                const deleteRequest = docStore.delete(id);
                deleteRequest.onsuccess = () => {
                    // Update knowledge base stats
                    const kbRequest = kbStore.get(doc.knowledgeBaseId);
                    kbRequest.onsuccess = () => {
                        const kb = kbRequest.result;
                        if (kb) {
                            kb.documentCount = Math.max((kb.documentCount || 0) - 1, 0);
                            kb.totalSize = Math.max((kb.totalSize || 0) - doc.size, 0);
                            kb.dateModified = new Date().toISOString();
                            kbStore.put(kb);
                        }
                    };

                    resolve();
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

    // Search functionality
    const searchDocuments = async (knowledgeBaseId, query) => {
        const documents = await getDocumentsByKnowledgeBase(knowledgeBaseId);
        const lowerQuery = query.toLowerCase();

        return documents.filter(doc => {
            return doc.name.toLowerCase().includes(lowerQuery) ||
                   doc.content.toLowerCase().includes(lowerQuery) ||
                   doc.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
        });
    };

    // Export public API
    return {
        init,
        // Knowledge Base operations
        createKnowledgeBase,
        getKnowledgeBase,
        getAllKnowledgeBases,
        updateKnowledgeBase,
        deleteKnowledgeBase,
        // Document operations
        createDocument,
        getDocument,
        getDocumentsByKnowledgeBase,
        updateDocument,
        deleteDocument,
        searchDocuments
    };
})();
