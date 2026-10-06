/**
 * Builds the final database strings (Markdown for descriptionText, JSON for dynamicMetadata)
 */
const buildFinalContent = (sections, metadata, aiResult) => {
    // 1. Build descriptionText (Markdown Table)
    let markdown = "";
    const hasExtractedTables = sections.some(sec => sec.content && (sec.content.includes('|---|') || sec.content.includes('| --- |')));

    if (hasExtractedTables) {
        for (const sec of sections) {
            if (!sec.heading && !sec.content) continue;
            if (sec.heading && sec.heading !== "Document Content") markdown += "### " + sec.heading + "\n";
            if (sec.content) markdown += sec.content + "\n\n";
        }
    } else {
        markdown += "| Section | Details |\n";
        markdown += "| --- | --- |\n";
        for (const sec of sections) {
            if (!sec.heading && !sec.content) continue;
            let heading = (sec.heading || "").replace(/\|/g, '-').replace(/\n/g, ' ');
            let content = (sec.content || "").replace(/\|/g, '-').replace(/\n/g, '<br>');
            if(heading === 'Document Content' && !content) continue;
            if(!heading) heading = '-';
            if(!content) content = '-';
            markdown += "| **" + heading + "** | " + content + " |\n";
        }
    }
    // 2. Build dynamicMetadata (JSON)
    const dynamicMetadata = {
        "Document Info": {
            title: aiResult.title,
            type: aiResult.type,
            keywords: aiResult.keywords,
            summary: aiResult.summary,
            referenceCode: aiResult.referenceCode
        },
        extraction: metadata
    };

    return {
        descriptionText: markdown.trim(),
        dynamicMetadata,
        title: aiResult.title,
        type: aiResult.type,
        referenceCode: aiResult.referenceCode,
        keywords: aiResult.keywords
    };
};

module.exports = { buildFinalContent };
