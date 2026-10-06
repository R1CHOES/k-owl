const fs = require('fs');

let code = fs.readFileSync('src/extraction/ollamaClient.js', 'utf8');

const oldPromptBlock = `        const prompt = \`You are a document formatter. Reorganize the following raw text into a clean, highly readable Markdown Table with exactly 2 columns: 'Section' and 'Details'.
CRITICAL RULES:
1. Use logical, human-readable titles for the 'Section' column (e.g., convert "AVAIL NOW" to "How to Avail").
2. In the 'Details' column, format the content cleanly.
3. DO NOT summarize or shorten the text. DO NOT remove any facts, numbers, or contact details.
4. Output ONLY the raw Markdown Table. Do not add any conversational text.

Raw Text:
\${chunk}\`;`;

const newPromptBlock = `        const prompt = \`You are an expert data organizer. Reorganize the following raw text into a clean Markdown Table with exactly 2 columns: 'Section' and 'Details'.

CRITICAL RULES FOR THE TABLE:
1. IDENTIFY THE MAIN SECTIONS: First, determine the logical main sections of the text (e.g., "Objective", "Methodology", "Target Output", "Contact Info"). Create a separate row for each section.
2. FORMATTING INSIDE CELLS: You CANNOT use the Enter key (newlines) inside a Markdown table cell. To create lists, bullet points, or line breaks inside the 'Details' column, you MUST use the HTML tag <br>. 
   Example: • Item 1<br>• Item 2<br>• Item 3
3. CLEAN & ORGANIZED: Do not just write dense raw text that goes from left to right. Break down complex information into easy-to-read bulleted lists using <br>.
4. NO SUMMARIZATION: Do not summarize or remove any facts, numbers, or contact details.
5. Output ONLY the raw Markdown Table. Do not add any conversational text.

Raw Text:
\${chunk}\`;`;

code = code.replace(oldPromptBlock, newPromptBlock);

fs.writeFileSync('src/extraction/ollamaClient.js', code);
