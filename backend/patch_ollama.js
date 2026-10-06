const fs = require('fs');

let code = fs.readFileSync('src/extraction/ollamaClient.js', 'utf8');

const newFunction = `

/**
 * Uses LLM to semantically reorganize the raw text into a clean Markdown Table.
 */
const formatContentWithAI = async (rawText) => {
    // split rawText into chunks of ~3500 chars to avoid CPU timeout
    const chunks = [];
    let currentChunk = "";
    const paragraphs = rawText.split('\\n\\n');
    for (const p of paragraphs) {
        if (currentChunk.length + p.length > 3500) {
            if(currentChunk) chunks.push(currentChunk);
            currentChunk = p;
        } else {
            currentChunk += (currentChunk ? "\\n\\n" : "") + p;
        }
    }
    if (currentChunk) chunks.push(currentChunk);

    let formattedMarkdown = "";

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        if(!chunk.trim()) continue;
        
        const prompt = \`You are a document formatter. Reorganize the following raw text into a clean, highly readable Markdown Table with exactly 2 columns: 'Section' and 'Details'.
CRITICAL RULES:
1. Use logical, human-readable titles for the 'Section' column (e.g., convert "AVAIL NOW" to "How to Avail").
2. In the 'Details' column, format the content cleanly.
3. DO NOT summarize or shorten the text. DO NOT remove any facts, numbers, or contact details.
4. Output ONLY the raw Markdown Table. Do not add any conversational text.

Raw Text:
\${chunk}\`;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15 * 60 * 1000); // 15 mins per chunk for CPU

            const response = await fetch(\`\${OLLAMA_URL}/api/generate\`, {
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
                const lines = aiText.split('\\n');
                const tableContent = lines.filter(l => l.trim().startsWith('|') && !l.includes('| ---') && !l.toLowerCase().includes('| section |')).join('\\n');
                formattedMarkdown += tableContent + "\\n";
            } else {
                const lines = aiText.split('\\n');
                const tableContent = lines.filter(l => l.trim().startsWith('|')).join('\\n');
                formattedMarkdown += tableContent + "\\n";
            }
            
        } catch (error) {
            console.error(\`[Ollama] Formatting chunk \${i+1} failed:\`, error.message);
            // Fallback: just append a raw table row
            if(i === 0) {
                formattedMarkdown += "| Section | Details |\\n| --- | --- |\\n";
            }
            formattedMarkdown += \`| Raw Content | \${chunk.replace(/\\|/g, '-').replace(/\\n/g, '<br>')} |\\n\`;
        }
    }

    return formattedMarkdown.trim();
};
`;

code = code.replace(
    'module.exports = { generateMetadata };',
    newFunction + '\nmodule.exports = { generateMetadata, formatContentWithAI };'
);

fs.writeFileSync('src/extraction/ollamaClient.js', code);
