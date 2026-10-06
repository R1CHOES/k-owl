const fs = require('fs');

let code = fs.readFileSync('src/workers/extractionWorker.js', 'utf8');

// Replace the polling logic
const replacement = `
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
};`;

code = code.replace(
    /const startWorker = async \(\) => \{[\s\S]*?\}, 10000\);\n\};/,
    replacement
);

fs.writeFileSync('src/workers/extractionWorker.js', code);
