const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

const AI_SCHEMA = {
    type: "object",
    properties: {
        title: { type: "string", description: "The official title of the document. Max 10 words." },
        type: { type: "string", description: "Document type, e.g., 'Brochure', 'Guidelines', 'Report'." },
        keywords: { type: "string", description: "Comma-separated keywords." },
        summary: { type: "string", description: "A concise 2-3 sentence summary of the document's purpose." },
        referenceCode: { type: "string", description: "Any official reference code, memo number, or ID found. Leave empty if none." }
    },
    required: ["title", "type", "keywords", "summary", "referenceCode"]
};

/**
 * Calls Ollama to extract metadata based strictly on the provided schema.
 */
const generateMetadata = async (sections, filename) => {
    // Only send the first ~4,000 characters and the list of headings
    // This is plenty for metadata extraction and keeps the prompt tiny for CPU inference.
    let previewText = "";
    for (const sec of sections) {
        if (previewText.length > 4000) break;
        previewText += `\n\n### ${sec.heading}\n${sec.content.substring(0, 1000)}`;
    }

    const headings = sections.map(s => s.heading).join(", ");

    const prompt = `You are a Metadata Extractor. Analyze this document and return the requested JSON fields.
Filename: ${filename}
Document Headings: ${headings}

Document Preview:
${previewText}
`;

    let attempt = 0;
    while (attempt < 2) {
        try {
            const controller = new AbortController();
            // CPU Inference can be VERY slow, so give it up to 15 minutes
            const timeoutId = setTimeout(() => controller.abort(), 15 * 60 * 1000);

            const response = await fetch(`${OLLAMA_URL}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    model: 'llama3.1',
                    prompt: prompt,
                    stream: false,
                    format: AI_SCHEMA,
                    options: {
                        num_ctx: 4096, // Reduced from 8192 to speed up CPU prompt ingestion
                        num_predict: 1024,
                        temperature: 0.0
                    }
                })
            });

            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`Ollama returned status ${response.status}`);

            const data = await response.json();
            const parsed = JSON.parse(data.response);
            
            // Validate
            if (!parsed.title || !parsed.summary) throw new Error("Missing required fields");
            
            return parsed;
        } catch (error) {
            console.error(`[Ollama] Metadata extraction attempt ${attempt + 1} failed: ${error.message}`);
            attempt++;
        }
    }
    
    // Fallback if LLM completely fails
    return {
        title: sections[0]?.heading || filename,
        type: "Document",
        keywords: "",
        summary: "Metadata extraction failed or timed out.",
        referenceCode: ""
    };
};



/**
 * Uses LLM to semantically reorganize the raw text into a clean Markdown Table.
 */
const formatContentWithAI = async (rawText) => {
    // split rawText into chunks of ~3500 chars to avoid CPU timeout
    const chunks = [];
    let currentChunk = "";
    const paragraphs = rawText.split('\n\n');
    for (const p of paragraphs) {
        if (currentChunk.length + p.length > 3500) {
            if(currentChunk) chunks.push(currentChunk);
            currentChunk = p;
        } else {
            currentChunk += (currentChunk ? "\n\n" : "") + p;
        }
    }
    if (currentChunk) chunks.push(currentChunk);

    let formattedMarkdown = "";

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        if(!chunk.trim()) continue;
        
        const prompt = `You are an expert data organizer. Reorganize the following raw text into a clean Markdown Table with exactly 2 columns: 'Section' and 'Details'.

CRITICAL RULES FOR THE TABLE:
1. IDENTIFY THE MAIN SECTIONS: First, determine the logical main sections of the text (e.g., "Objective", "Methodology", "Target Output", "Contact Info"). Create a separate row for each section.
2. FORMATTING INSIDE CELLS: You CANNOT use the Enter key (newlines) inside a Markdown table cell. To create lists, bullet points, or line breaks inside the 'Details' column, you MUST use the HTML tag <br>. 
   Example: • Item 1<br>• Item 2<br>• Item 3
3. CLEAN & ORGANIZED: Do not just write dense raw text that goes from left to right. Break down complex information into easy-to-read bulleted lists using <br>.
4. NO SUMMARIZATION: Do not summarize or remove any facts, numbers, or contact details.
5. Output ONLY the raw Markdown Table. Do not add any conversational text.

Raw Text:
${chunk}`;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15 * 60 * 1000); // 15 mins per chunk for CPU

            const response = await fetch(`${OLLAMA_URL}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    model: 'llama3.1',
                    prompt: prompt,
                    stream: false,
                    options: {
                        num_ctx: 4096,
                        num_predict: 2048,
                        temperature: 0.1
                    }
                })
            });

            clearTimeout(timeoutId);
            if (!response.ok) throw new Error("Ollama HTTP Error");
            
            const result = await response.json();
            let aiText = result.response.trim();
            
            // Clean up if the AI included conversational filler
            if(aiText.includes('| Section |')) {
                aiText = '| Section |' + aiText.split('| Section |')[1];
            }
            
            // Remove headers for subsequent chunks so we can stitch them into one continuous table
            if (i > 0) {
                const lines = aiText.split('\n');
                const tableContent = lines.filter(l => l.trim().startsWith('|') && !l.includes('| ---') && !l.toLowerCase().includes('| section |')).join('\n');
                formattedMarkdown += tableContent + "\n";
            } else {
                const lines = aiText.split('\n');
                const tableContent = lines.filter(l => l.trim().startsWith('|')).join('\n');
                formattedMarkdown += tableContent + "\n";
            }
            
        } catch (error) {
            console.error(`[Ollama] Formatting chunk ${i+1} failed:`, error.message);
            // Fallback: just append a raw table row
            if(i === 0) {
                formattedMarkdown += "| Section | Details |\n| --- | --- |\n";
            }
            formattedMarkdown += `| Raw Content | ${chunk.replace(/\|/g, '-').replace(/\n/g, '<br>')} |\n`;
        }
    }

    return formattedMarkdown.trim();
};

module.exports = { generateMetadata, formatContentWithAI };
