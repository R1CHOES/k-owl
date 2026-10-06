const fs = require('fs');

let code = fs.readFileSync('src/workers/extractionWorker.js', 'utf8');

// Add the import
code = code.replace(
    "const { generateMetadata } = require('../extraction/ollamaClient');",
    "const { generateMetadata, formatContentWithAI } = require('../extraction/ollamaClient');"
);

// Inject the formatting logic right before Pinecone Embeddings
const replacement = `
        // 4. Build final fields (Generates fallback programmatic markdown)
        const contentData = buildFinalContent(sections, metadata, aiResult);

        // 4.5 AI Semantic Formatting (Only if the document didn't contain native tables from find_tables)
        const hasExtractedTables = sections.some(sec => sec.content && (sec.content.includes('|---|') || sec.content.includes('| --- |')));
        
        if (!hasExtractedTables) {
            console.log(\`[Worker] Running AI Semantic Formatting...\`);
            // We pass the raw text without the hardcoded programmatic markdown table
            const rawText = sections.map(s => (s.heading ? s.heading + '\\n' : '') + s.content).join('\\n\\n');
            const aiFormattedMarkdown = await formatContentWithAI(rawText);
            if (aiFormattedMarkdown) {
                contentData.descriptionText = aiFormattedMarkdown;
            }
        }

        // 5. Pinecone Embeddings`;

code = code.replace(
    /\/\/ 4\. Build final fields[\s\S]*?\/\/ 5\. Pinecone Embeddings/,
    replacement
);

fs.writeFileSync('src/workers/extractionWorker.js', code);
