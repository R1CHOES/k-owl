const fs = require('fs');
const path = require('path');
const { runExtractor } = require('./src/extraction/runExtractor');
const { organizeIntoSections } = require('./src/extraction/sectioner');

async function testFiles() {
    const uploadDir = 'C:/Users/Admin/.gemini/antigravity/brain/d50411d2-0706-44bf-9b28-49ce56ab0368/.user_uploaded';
    const files = fs.readdirSync(uploadDir).filter(f => f.endsWith('.pdf'));
    
    for (const file of files) {
        console.log('\n======================================================');
        console.log('Testing:', file);
        const filePath = path.join(uploadDir, file);
        try {
            const extractData = await runExtractor(filePath);
            const { sections, metadata } = organizeIntoSections(extractData.pages);
            
            console.log('--- METADATA ---');
            console.log(metadata);
            console.log('\n--- EXTRACTED SECTIONS ---');
            for (const sec of sections) {
                console.log(`\n### [HEADING] ${sec.heading}`);
                console.log(sec.content.substring(0, 300) + (sec.content.length > 300 ? '...\n[TRUNCATED]' : ''));
            }
        } catch (e) {
            console.error('FAILED:', e.message);
        }
    }
}
testFiles();
