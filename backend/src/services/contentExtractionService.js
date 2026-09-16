const fs = require('fs');
const pdf = require('pdf-parse');
const { PrismaClient } = require('@prisma/client');
const pdfGeneratorService = require('./pdfGeneratorService');

const prisma = new PrismaClient();

/**
 * Extracts raw text from a PDF and initializes a CMS Content record.
 * @param {number} documentVersionId - The ID of the DocumentVersion to process.
 */
const extractAndOrganize = async (documentVersionId) => {
    try {
        // 1. Fetch the DocumentVersion
        const version = await prisma.documentVersion.findUnique({
            where: { id: documentVersionId }
        });

        if (!version) {
            throw new Error(`DocumentVersion ${documentVersionId} not found.`);
        }

        if (version.mimeType !== 'application/pdf') {
            console.log(`DocumentVersion ${documentVersionId} is not a PDF. Skipping extraction.`);
            return null; // For Phase 1, we only handle PDFs.
        }

        // 2. Read the physical file
        if (!fs.existsSync(version.filePath)) {
            throw new Error(`File not found at path: ${version.filePath}`);
        }
        
        const dataBuffer = fs.readFileSync(version.filePath);

        // 3. Extract text using pdf-parse
        const data = await pdf(dataBuffer);
        
        // 4. Clean the extracted text
        // Remove excessive newlines and whitespace
        const rawText = data.text;
        const cleanedText = rawText.replace(/\s+/g, ' ').trim();

        // 5. Generate Initial CMS Data
        // Use filename without extension as placeholder title
        const placeholderTitle = version.filename.replace(/\.[^/.]+$/, "");
        
        // Take the first 500 characters for preliminary summary
        const preliminarySummary = cleanedText.substring(0, 500);

        const contentData = {
            referenceCode: '',
            sourceUrl: '',
            type: '',
            title: placeholderTitle,
            keywords: '',
            descriptionText: preliminarySummary
        };

        // Automate PDF Generation
        await pdfGeneratorService.generateCleanPDF(version.id, contentData);

        // 6. Save to Database
        // Use upsert so that if extraction is re-run (e.g. on restore), it won't crash on unique constraint
        const newContent = await prisma.content.upsert({
            where: { documentVersionId: version.id },
            update: {
                title: placeholderTitle,
                descriptionText: preliminarySummary,
                status: 'DRAFT',
            },
            create: {
                documentVersionId: version.id,
                title: placeholderTitle,
                descriptionText: preliminarySummary,
                status: 'DRAFT',
            }
        });

        console.log(`Successfully extracted and created CMS Content for Version ID: ${version.id}`);
        return newContent;

    } catch (error) {
        console.error('Extraction Service Error:', error);
        throw error;
    }
};

module.exports = {
    extractAndOrganize
};
