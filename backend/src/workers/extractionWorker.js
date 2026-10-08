const { PrismaClient } = require('@prisma/client');
const pdfGeneratorService = require('../services/pdfGeneratorService');
const { Pinecone } = require('@pinecone-database/pinecone');
const fs = require('fs');
const { execFile } = require('child_process');
const path = require('path');

const { generateMetadata } = require('../extraction/ollamaClient');

const prisma = new PrismaClient();
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY || 'dummy-key' });
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

const runMarkdownExtractor = (filePath) => {
    return new Promise((resolve, reject) => {
        const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
        const scriptPath = path.join(__dirname, '../../scripts/extract_markdown.py');
        
        execFile(pythonCmd, [scriptPath, filePath], { maxBuffer: 50 * 1024 * 1024 }, (error, stdout, stderr) => {
            if (error) return reject(error);
            try {
                const jsonStart = stdout.indexOf('{');
                const result = JSON.parse(stdout.substring(jsonStart));
                if (!result.ok) throw new Error(result.error);
                resolve(result.markdown);
            } catch (e) {
                reject(e);
            }
        });
    });
};

const processDocument = async (documentVersionId) => {
    console.log('[Worker] Starting extraction for DocumentVersion: ' + documentVersionId);
    
    let version;
    try {
        version = await prisma.documentVersion.findUnique({
            where: { id: documentVersionId },
            include: { document: true }
        });

        if (!version) throw new Error("DocumentVersion not found");

        console.log('[Worker] Running fast Code Organizer markdown extraction on ' + version.filePath);
        const markdownTableText = await runMarkdownExtractor(version.filePath);
        
        if (!markdownTableText || markdownTableText.trim().length < 10) {
             throw new Error("Extracted text was empty or too short.");
        }

        console.log('[Worker] Running fast LLM metadata extraction...');
        const aiResult = await generateMetadata(markdownTableText, version.filename);

        const dynamicMetadata = {
            "Document Info": aiResult,
            extraction: { method: 'pymupdf4llm', coverage: 1.0 }
        };

        const newContent = await prisma.content.upsert({
            where: { documentVersionId: version.id },
            update: {
                title: aiResult.title,
                type: aiResult.type,
                referenceCode: aiResult.referenceCode,
                keywords: aiResult.keywords,
                descriptionText: markdownTableText,
                status: 'EXTRACTED',
                dynamicMetadata: dynamicMetadata
            },
            create: {
                documentVersionId: version.id,
                title: aiResult.title,
                type: aiResult.type,
                referenceCode: aiResult.referenceCode,
                keywords: aiResult.keywords,
                descriptionText: markdownTableText,
                status: 'EXTRACTED',
                dynamicMetadata: dynamicMetadata
            }
        });

        try {
            if (process.env.PINECONE_API_KEY) {
                const embedRes = await fetch(OLLAMA_URL + '/api/embeddings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'nomic-embed-text',
                        prompt: aiResult.summary
                    })
                });
                const embedData = await embedRes.json();
                if (embedData.embedding) {
                    const indexName = process.env.PINECONE_INDEX_NAME || 'oneowl-index';
                    const index = pinecone.Index(indexName);
                    await index.upsert([{
                        id: newContent.id.toString(),
                        values: embedData.embedding,
                        metadata: { title: aiResult.title, type: aiResult.type }
                    }]);
                }
            }
        } catch (e) {
            console.error("[Worker] Embedding skipped/failed", e.message);
        }

        await pdfGeneratorService.generateCleanPDF(version.id, {
            title: aiResult.title,
            descriptionText: markdownTableText
        });

        await prisma.document.update({ 
            where: { id: version.documentId }, 
            data: { status: 'IN_QA' } 
        });

        console.log('[Worker] Successfully completed processing for Version ID: ' + version.id);
        
    } catch (error) {
        console.error('[Worker] Extraction Error:', error.message);
        
        try {
            if (version && version.document) {
                await prisma.document.update({ 
                    where: { id: version.documentId }, 
                    data: { status: 'DRAFT' } 
                });
                await prisma.content.upsert({
                    where: { documentVersionId: version.id },
                    update: { status: 'EXTRACTION_FAILED', descriptionText: 'Extraction failed: ' + error.message },
                    create: { documentVersionId: version.id, status: 'EXTRACTION_FAILED', descriptionText: 'Extraction failed: ' + error.message }
                });
            }
        } catch (dbError) {}
    }
};

const processingIds = new Set();

const startWorker = async () => {
    console.log('[Worker] Fast offline extraction worker started. Polling every 10 seconds...');
    
    setInterval(async () => {
        try {
            const pendingDocument = await prisma.document.findFirst({
                where: { 
                    status: 'PENDING_EXTRACTION',
                    isArchived: false,
                    versions: { some: {} }
                },
                include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
                orderBy: { createdAt: 'desc' }
            });

            if (pendingDocument && pendingDocument.versions.length > 0) {
                if (processingIds.has(pendingDocument.id)) return;
                
                processingIds.add(pendingDocument.id);
                try {
                    await processDocument(pendingDocument.versions[0].id);
                } finally {
                    processingIds.delete(pendingDocument.id);
                }
            }
        } catch (error) {
            console.error('[Worker] Polling error:', error);
        }
    }, 10000);
};

module.exports = { startWorker, processDocument };
