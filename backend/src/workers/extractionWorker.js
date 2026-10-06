const { PrismaClient } = require('@prisma/client');
const pdfGeneratorService = require('../services/pdfGeneratorService');
const { Pinecone } = require('@pinecone-database/pinecone');
const fs = require('fs');

const { runExtractor, ExtractionError } = require('../extraction/runExtractor');
const { organizeIntoSections } = require('../extraction/sectioner');
const { generateMetadata, formatContentWithAI } = require('../extraction/ollamaClient');
const { buildFinalContent } = require('../extraction/contentBuilder');

const prisma = new PrismaClient();
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY || 'dummy-key' });
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

// ============================================================================
// processDocument - Main extraction pipeline
// ============================================================================
const processDocument = async (documentVersionId) => {
    console.log(`[Worker] Starting extraction for DocumentVersion: ${documentVersionId}`);
    
    let version;
    try {
        version = await prisma.documentVersion.findUnique({
            where: { id: documentVersionId },
            include: { document: true }
        });

        if (!version) throw new Error("DocumentVersion not found");

        // 1. Extract physical blocks via Python
        console.log(`[Worker] Running extract.py on ${version.filePath}...`);
        const extractData = await runExtractor(version.filePath);

        // 2. Organize blocks into sections
        console.log(`[Worker] Organizing sections...`);
        const { sections, metadata } = organizeIntoSections(extractData.pages);
        
        metadata.durationMs = Date.now(); // approximate, we can refine this
        
        if (sections.length === 0 || metadata.coverage < 0.90) { // Tolerant threshold for coverage
             throw new ExtractionError("Extraction coverage too low or no sections found", "Coverage: " + metadata.coverage);
        }

        // 3. AI Metadata Extraction (fast!)
        console.log(`[Worker] Running LLM metadata extraction...`);
        const aiResult = await generateMetadata(sections, version.filename);

        
        // 4. Build final fields (Generates fallback programmatic markdown)
        const contentData = buildFinalContent(sections, metadata, aiResult);

        // 4.5 AI Semantic Formatting (Only if the document didn't contain native tables from find_tables)
        const hasExtractedTables = sections.some(sec => sec.content && (sec.content.includes('|---|') || sec.content.includes('| --- |')));
        
        if (!hasExtractedTables) {
            console.log(`[Worker] Running AI Semantic Formatting...`);
            // We pass the raw text without the hardcoded programmatic markdown table
            const rawText = sections.map(s => (s.heading ? s.heading + '\n' : '') + s.content).join('\n\n');
            const aiFormattedMarkdown = await formatContentWithAI(rawText);
            if (aiFormattedMarkdown) {
                contentData.descriptionText = aiFormattedMarkdown;
            }
        }

        // 5. Pinecone Embeddings (same as before, but fed better text)
        let embeddingVector = [];
        try {
            const embedRes = await fetch(`${OLLAMA_URL}/api/embeddings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'nomic-embed-text',
                    prompt: contentData.dynamicMetadata["Document Info"].summary + "\n\n" + sections.map(s => s.heading).join('\n')
                })
            });
            const embedData = await embedRes.json();
            if (embedData.embedding) embeddingVector = embedData.embedding;
        } catch (e) {
            console.error("[Worker] Ollama embedding failed", e);
        }

        // 6. Save to database
        const newContent = await prisma.content.upsert({
            where: { documentVersionId: version.id },
            update: {
                title: contentData.title,
                type: contentData.type,
                referenceCode: contentData.referenceCode,
                keywords: contentData.keywords,
                descriptionText: contentData.descriptionText,
                status: 'EXTRACTED',
                dynamicMetadata: contentData.dynamicMetadata
            },
            create: {
                documentVersionId: version.id,
                title: contentData.title,
                type: contentData.type,
                referenceCode: contentData.referenceCode,
                keywords: contentData.keywords,
                descriptionText: contentData.descriptionText,
                status: 'EXTRACTED',
                dynamicMetadata: contentData.dynamicMetadata
            }
        });

        if (embeddingVector.length > 0) {
            try {
                const indexName = process.env.PINECONE_INDEX_NAME || 'oneowl-index';
                const index = pinecone.Index(indexName);
                await index.upsert([{
                    id: newContent.id.toString(),
                    values: embeddingVector,
                    metadata: { title: contentData.title, type: contentData.type }
                }]);
            } catch(e) {}
        }

        // 7. Generate PDF
        await pdfGeneratorService.generateCleanPDF(version.id, contentData);

        // 8. Update Document status to IN_QA
        await prisma.document.update({ 
            where: { id: version.documentId }, 
            data: { status: 'IN_QA' } 
        });

        console.log(`[Worker] Successfully completed processing for Version ID: ${version.id}`);
        
    } catch (error) {
        console.error('[Worker] Extraction Error:', error.message);
        if (error.stderr) console.error(error.stderr);
        
        try {
            if (version && version.document) {
                // Fallback to DRAFT and set Content status to EXTRACTION_FAILED
                await prisma.document.update({ 
                    where: { id: version.documentId }, 
                    data: { status: 'DRAFT' } 
                });
                
                await prisma.content.upsert({
                    where: { documentVersionId: version.id },
                    update: { status: 'EXTRACTION_FAILED', descriptionText: `Extraction failed: ${error.message}` },
                    create: { documentVersionId: version.id, status: 'EXTRACTION_FAILED', descriptionText: `Extraction failed: ${error.message}` }
                });
            }
        } catch (dbError) {
             console.error('[Worker] Failed to update error status:', dbError);
        }
    }
};


const processingIds = new Set();

const startWorker = async () => {
    console.log('[Worker] Background extraction worker started. Polling every 10 seconds...');
    
    setInterval(async () => {
        try {
            // Find one document that isn't currently being processed in memory
            const pendingDocument = await prisma.document.findFirst({
                where: { 
                    status: 'PENDING_EXTRACTION',
                    isArchived: false,
                    versions: { some: {} }
                },
                include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } }
            });

            if (pendingDocument && pendingDocument.versions.length > 0) {
                if (processingIds.has(pendingDocument.id)) {
                    // Already processing this document, skip
                    return;
                }
                
                // Lock the job in memory instead of changing the DB status
                // This keeps the status as PENDING_EXTRACTION so the frontend UI knows to show the loading animation!
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

module.exports = {
    startWorker,
    processDocument
};
