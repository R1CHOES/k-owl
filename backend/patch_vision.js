const fs = require('fs');

let text = fs.readFileSync('C:/Users/Admin/Downloads/k-owl/backend/src/workers/extractionWorker.js', 'utf8');

const startMarker = '// extractTextWithNodeTesseract';
const endMarker = 'const contentData = {';

const startIdx = text.indexOf(startMarker);
const endIdx = text.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
    console.error("Markers not found");
    process.exit(1);
}

const replacement = `// ============================================================================
// extractImagesViaPython - Converts PDF to PNGs for Vision AI
// ============================================================================
const crypto = require('crypto');
const os = require('os');
const path = require('path');

const extractImagesViaPython = async (pdfPath) => {
    return new Promise((resolve, reject) => {
        console.log(\`[Worker] Generating images via Python for Vision Model: \${pdfPath}\`);
        const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
        const extractScript = path.join(__dirname, '../../scripts/extract_images.py');
        const tempDir = path.join(os.tmpdir(), \`vision_\${crypto.randomBytes(8).toString('hex')}\`);

        const { execFile } = require('child_process');
        execFile(pythonCmd, [extractScript, pdfPath, tempDir], {
            timeout: 2 * 60 * 1000
        }, async (error, stdout, stderr) => {
            if (error) {
                console.error(\`[Worker] Python Image Extraction failed:\`, error.message);
                return resolve([]);
            }
            const imagePaths = stdout.trim().split('\\n').filter(p => p.trim() !== '' && !p.startsWith('ERROR') && !p.startsWith('INFO'));
            resolve({ imagePaths, tempDir });
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

        // Step 2: Determine if we need to use the Vision Model
        if (extractedText.trim().length < 50) {
            console.log("[Worker] Scanned PDF or Infographic detected (< 50 chars). Routing to Gemma 4 Vision Model...");
            try {
                const { imagePaths, tempDir } = await extractImagesViaPython(version.filePath);
                
                if (imagePaths && imagePaths.length > 0) {
                    console.log(\`[Worker] Extracted \${imagePaths.length} images. Converting to base64...\`);
                    const base64Images = [];
                    for (const imgPath of imagePaths) {
                        const imgBuffer = fs.readFileSync(imgPath.trim());
                        base64Images.push(imgBuffer.toString('base64'));
                    }

                    console.log("[Worker] Sending images to gemma4:latest Vision API...");
                    const response = await fetch(\`\${OLLAMA_URL}/api/generate\`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            model: 'gemma4:latest',
                            prompt: prompt,
                            images: base64Images,
                            stream: false,
                            format: 'json'
                        })
                    });
                    const data = await response.json();
                    dynamicMetadata = JSON.parse(data.response);

                    // Cleanup temp images
                    try {
                        for (const img of imagePaths) fs.unlinkSync(img.trim());
                        fs.rmdirSync(tempDir);
                    } catch (e) {}
                } else {
                    console.log("[Worker] Python script returned no images.");
                }
            } catch (visionError) {
                console.error("[Worker] Gemma 4 Vision extraction failed:", visionError);
                dynamicMetadata = { extractionError: "Vision AI failed to extract metadata." };
            }
        } else {
            console.log("[Worker] Digital PDF detected. Routing to llama3.1 Text Model...");
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
