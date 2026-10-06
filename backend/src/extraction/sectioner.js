/**
 * Takes the raw blocks from extract.py and organizes them into headings and body text.
 */
const organizeIntoSections = (pagesData) => {
    // 1. Calculate overall stats
    let totalBlocks = 0;
    let totalChars = 0;
    let allSizes = [];
    let method = 'unknown';
    let ocrPages = [];

    for (const page of pagesData) {
        if (page.method !== 'text' && page.method !== 'docx') {
            method = page.method;
        }
        if (page.method === 'ocr') ocrPages.push(page.page);
        
        for (const block of page.blocks) {
            totalBlocks++;
            totalChars += block.text.length;
            if (block.size > 0) allSizes.push(block.size);
        }
    }

    if (method === 'unknown' && pagesData.length > 0) method = pagesData[0].method;
    if (pagesData.some(p => p.method === 'text') && pagesData.some(p => p.method === 'ocr')) method = 'mixed';

    // 2. Determine base font size to find headings
    allSizes.sort((a, b) => a - b);
    const medianSize = allSizes.length > 0 ? allSizes[Math.floor(allSizes.length / 2)] : 12;
    // A heading must be at least 15% larger than median, or bold, or ALL CAPS
    const headingSizeThreshold = medianSize * 1.15;

    let sections = [];
    let currentHeading = "Document Content";
    let currentBody = [];
    let processedChars = 0;

    const flushSection = () => {
        if (currentBody.length > 0) {
            sections.push({
                heading: currentHeading,
                content: currentBody.join('\n\n').trim()
            });
            currentBody = [];
        }
    };

    const isHeading = (block, text) => {
        // A heading should never be a massive paragraph. 
        // 150 chars is about 2-3 lines of text.
        if (text.length > 150) return false;

        if (block.size >= headingSizeThreshold) return true;
        if (block.bold) return true;
        if (text === text.toUpperCase() && text.length > 4 && text.length < 60) return true;
        if (/^\d+\.\s+[A-Z]/.test(text) && text.length < 100) return true; // e.g. "1. Objectives"
        return false;
    };

    for (const page of pagesData) {
        for (let i = 0; i < page.blocks.length; i++) {
            const block = page.blocks[i];
            const text = block.text.trim();
            if (!text) continue;

            // Skip page numbers / headers / footers
            if (text.length < 4 && /^\d+$/.test(text)) continue;
            if (text.toLowerCase().includes("page ") && text.length < 15) continue;

            processedChars += text.length;

            if (isHeading(block, text)) {
                // If the previous block was also a heading and vertically close, merge them
                // But for now, just start a new section
                flushSection();
                currentHeading = text;
            } else {
                currentBody.push(text);
            }
        }
    }

    flushSection();

    // Coverage calculation
    const coverage = totalChars > 0 ? processedChars / totalChars : 1.0;

    return {
        sections,
        metadata: {
            method,
            pages: pagesData.length,
            ocrPages,
            coverage: parseFloat(coverage.toFixed(4))
        }
    };
};

module.exports = { organizeIntoSections };
