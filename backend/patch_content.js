const fs = require('fs');

let code = fs.readFileSync('src/extraction/contentBuilder.js', 'utf8');

const replacement = `    // 1. Build descriptionText (Markdown Table)
    let markdown = "";
    const hasExtractedTables = sections.some(sec => sec.content && (sec.content.includes('|---|') || sec.content.includes('| --- |')));

    if (hasExtractedTables) {
        for (const sec of sections) {
            if (!sec.heading && !sec.content) continue;
            if (sec.heading && sec.heading !== "Document Content") markdown += "### " + sec.heading + "\\n";
            if (sec.content) markdown += sec.content + "\\n\\n";
        }
    } else {
        markdown += "| Section | Details |\\n";
        markdown += "| --- | --- |\\n";
        for (const sec of sections) {
            if (!sec.heading && !sec.content) continue;
            let heading = (sec.heading || "").replace(/\\|/g, '-').replace(/\\n/g, ' ');
            let content = (sec.content || "").replace(/\\|/g, '-').replace(/\\n/g, '<br>');
            if(heading === 'Document Content' && !content) continue;
            if(!heading) heading = '-';
            if(!content) content = '-';
            markdown += "| **" + heading + "** | " + content + " |\\n";
        }
    }
`;

code = code.replace(
  /    \/\/ 1\. Build descriptionText \(Markdown\)[\s\S]*?(?=    \/\/ 2\. Build dynamicMetadata)/,
  replacement
);

fs.writeFileSync('src/extraction/contentBuilder.js', code);
