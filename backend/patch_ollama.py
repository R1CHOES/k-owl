content = """const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const http = require('http');

const AI_SCHEMA = {
    type: "object",
    properties: {
        title: { type: "string", description: "The official title of the document. Max 10 words." },
        type: { type: "string", description: "Document type, e.g., 'Brochure', 'Guidelines', 'Report'." },
        keywords: { type: "string", description: "Comma-separated keywords." },
        summary: { type: "string", description: "A comprehensive summary of the entire document's purpose, scope, and key points." },
        referenceCode: { type: "string", description: "Any official reference code, memo number, or ID found. Leave empty if none." }
    },
    required: ["title", "type", "keywords", "summary", "referenceCode"]
};

const getSmartPreview = (text, maxChars) => {
    if (text.length <= maxChars) return text;
    const half = Math.floor(maxChars / 2);
    return text.substring(0, half) + "\n\n...[MIDDLE OF DOCUMENT OMITTED]...\n\n" + text.substring(text.length - half);
};

const ollamaGenerate = (payload, timeoutMs) => {
    return new Promise((resolve, reject) => {
        const url = new URL(OLLAMA_URL + '/api/generate');
        const req = http.request({
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            timeout: timeoutMs
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200) return reject(new Error('Ollama returned ' + res.statusCode));
                resolve(JSON.parse(data));
            });
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timed out after ' + timeoutMs + 'ms'));
        });
        
        req.write(JSON.stringify(payload));
        req.end();
    });
};

const generateMetadata = async (markdownText, filename) => {
    const previewText = getSmartPreview(markdownText, 15000);
    const prompt = `You are a Metadata Extractor. Analyze this document and return the requested JSON fields. Make sure to read the entire provided text to generate an accurate summary.
Filename: ${filename}

Document Content:
${previewText}`;

    let attempt = 0;
    while (attempt < 2) {
        try {
            const data = await ollamaGenerate({
                model: 'llama3.1',
                prompt: prompt,
                stream: false,
                format: AI_SCHEMA,
                options: { num_ctx: 8192, num_predict: 512, temperature: 0.0 }
            }, 3 * 60 * 1000);
            
            const parsed = JSON.parse(data.response);
            if (!parsed.title || !parsed.summary) throw new Error("Missing required fields");
            return parsed;
        } catch (error) {
            console.error('[Ollama] Metadata extraction attempt ' + (attempt + 1) + ' failed: ' + error.message);
            attempt++;
        }
    }
    
    return {
        title: filename,
        type: "Document",
        keywords: "",
        summary: "Metadata extraction failed.",
        referenceCode: ""
    };
};

const organizeContentIntoTable = async (markdownText) => {
    const previewText = getSmartPreview(markdownText, 25000);
    const prompt = `You are an expert Document Organizer. Your job is to read the provided document text and synthesize it into a highly organized, professional Markdown table. 

Create a comprehensive table that captures all the important sections, guidelines, compliance rules, or key information from the document. 
Use the following columns:
| Section / Topic | Key Details / Requirements |

RULES:
1. ONLY output the Markdown table. Do not write any introduction or conclusion text.
2. Ensure the table covers the beginning, middle, and end of the provided text.
3. Be concise but informative in the details column.

Document Content:
${previewText}`;

    try {
        const data = await ollamaGenerate({
            model: 'llama3.1',
            prompt: prompt,
            stream: false,
            options: { num_ctx: 8192, num_predict: 2048, temperature: 0.1 }
        }, 15 * 60 * 1000); 

        let tableText = data.response.trim();
        if (!tableText.includes("|")) {
            tableText = "| Section | Details |\n|---|---|\n| Output Error | AI failed to format as table |\n\n" + tableText;
        }
        return tableText;

    } catch (error) {
        console.error('[Ollama] Table organization failed: ' + error.message);
        return "| Section | Details |\n|---|---|\n| System Error | AI Organizer timed out or failed to process the document. |";
    }
};

module.exports = { generateMetadata, organizeContentIntoTable };"""

with open('src/extraction/ollamaClient.js', 'w', encoding='utf-8') as f:
    f.write(content)
