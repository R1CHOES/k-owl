const fs = require('fs');

let text = fs.readFileSync('C:/Users/Admin/Downloads/k-owl/backend/src/workers/extractionWorker.js', 'utf8');

const startMarker = '// extractImagesViaPython';
const endMarker = 'const contentData = {';

const startIdx = text.indexOf(startMarker);
const endIdx = text.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
    console.error("Markers not found");
    process.exit(1);
}

const replacement = `// ============================================================================
// extractTextWithAdvancedOCR - Uses EasyOCR and PyMuPDF to extract text preserving layout
// ============================================================================
const crypto = require('crypto');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');

const extractTextWithAdvancedOCR = async (pdfPath) => {
    return new Promise((resolve, reject) => {
        console.log(\`[Worker] Running Advanced Layout-Aware OCR via Python for: \${pdfPath}\`);
        const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
        const extractScript = path.join(__dirname, '../../scripts/pdf_to_text.py');

        execFile(pythonCmd, [extractScript, pdfPath], {
            timeout: 5 * 60 * 1000, // 5 minutes (CPU OCR can be slow)
            env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
        }, async (error, stdout, stderr) => {
            if (error) {
                console.error(\`[Worker] Advanced OCR failed:\`, error.message);
                return resolve('');
            }
            // Clean up pytorch warnings
            let cleanText = stdout.trim();
            const warningEndIdx = cleanText.lastIndexOf('UserWarning:');
            if (warningEndIdx !== -1) {
                const afterWarning = cleanText.substring(warningEndIdx);
                const nextNewline = afterWarning.indexOf('\\n\\n');
                if (nextNewline !== -1) {
                    cleanText = afterWarning.substring(nextNewline).trim();
                }
            }
            
            // if we still have warnings at the top, just regex strip them
            cleanText = cleanText.replace(/C:\\\\.*\\\\UserWarning:.*\\n.*\\n/g, '');
            
            // Simple fallback to strip PyTorch logs just in case
            const lines = cleanText.split('\\n').filter(line => !line.includes('UserWarning') && !line.includes('site-packages'));
            resolve(lines.join('\\n').trim());
        });
    });
};

// ============================================================================
// processDocument - Main extraction pipeline
// ============================================================================
const processDocument = async (documentVersionId) => {
    console.log(\`[Worker] Starting extraction for DocumentVersion: \${documentVersionId}\`);
    try {
        const version = await prisma.documentVersion.findUnique({
            where: { id: documentVersionId }
        });

        if (!version) throw new Error("DocumentVersion not found");

        const pdfBuffer = fs.readFileSync(version.filePath);
        
        let extractedText = '';
        
        // Step 1: Try standard pdf-parse for digital PDFs (fast path)
        try {
            const parsedData = await pdfParse(pdfBuffer);
            extractedText = parsedData.text;
            console.log(\`[Worker] pdf-parse extracted \${extractedText.trim().length} characters.\`);
        } catch(e) {
            console.error("[Worker] pdf-parse fatal error:", e);
            extractedText = "";
        }

        const prompt = \`You are an extremely thorough and comprehensive Data Extraction AI. Your task is to extract ALL information from the provided document into a highly detailed JSON object.
CRITICAL INSTRUCTIONS:
1. DO NOT SUMMARIZE. Extract the complete details, full paragraphs, all list items, all tables, all subsections, and all contact information exactly as presented.
2. Only extract information that is ACTUALLY present in the document, but ensure NOTHING is left behind.
3. Structure the JSON logically into deeply nested objects reflecting the document's structure (e.g., Sections -> Subsections -> Content).
4. Do NOT make up sections if they are not there.
5. Return ONLY valid JSON without any markdown formatting wrappers.\`;
        
        let dynamicMetadata = {};
        let extractedTitle = version.filename.replace(/\\.[^/.]+$/, "");
        let cleanDescriptionText = "Document processed via Ollama.";

        // Step 2: Determine if we need to use the Advanced Layout OCR
        if (extractedText.trim().length < 50) {
            console.log("[Worker] Scanned PDF or Infographic detected (< 50 chars). Routing to Advanced Layout-Aware OCR...");
            try {
                extractedText = await extractTextWithAdvancedOCR(version.filePath);
                console.log(\`[Worker] Advanced OCR extracted \${extractedText.length} characters.\`);
            } catch (ocrError) {
                console.error("[Worker] Advanced OCR failed:", ocrError);
            }
        } 
        
        // Feed text to AI
        if (extractedText.trim().length > 0) {
            console.log("[Worker] Routing extracted text to llama3.1...");
            try {
                const response = await fetch(\`\${OLLAMA_URL}/api/generate\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'llama3.1',
                        prompt: \`\${prompt}\\n\\nDocument Text:\\n\${extractedText.substring(0, 32000)}\`,
                        stream: false,
                        format: 'json'
                    })
                });
                const data = await response.json();
                dynamicMetadata = JSON.parse(data.response);
            } catch (aiError) {
                console.error('[Worker] llama3.1 Text Extraction failed:', aiError);
                dynamicMetadata = { extractionError: "AI failed to extract metadata." };
            }
        } else {
             console.log("[Worker] No text could be extracted from the document.");
             dynamicMetadata = { extractionError: "No readable text found in document." };
        }
        
        if (dynamicMetadata && dynamicMetadata.title) {
            extractedTitle = dynamicMetadata.title;
        }

        cleanDescriptionText = buildDescriptionMarkdown(dynamicMetadata);

        let embeddingVector = [];
        try {
            const embedRes = await fetch(\`\${OLLAMA_URL}/api/embeddings\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'nomic-embed-text',
                    prompt: JSON.stringify(dynamicMetadata)
                })
            });
            const embedData = await embedRes.json();
            if (embedData.embedding) embeddingVector = embedData.embedding;
        } catch (e) {
            console.error("[Worker] Ollama embedding failed", e);
        }

        `;

const newText = text.substring(0, startIdx) + replacement + text.substring(endIdx);
fs.writeFileSync('C:/Users/Admin/Downloads/k-owl/backend/src/workers/extractionWorker.js', newText);
