const fs = require('fs');
const pdf = require('pdf-parse');
const { PrismaClient } = require('@prisma/client');
const pdfGeneratorService = require('./pdfGeneratorService');
const { GoogleGenAI } = require('@google/genai');

const prisma = new PrismaClient();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const extractAndOrganize = async (documentVersionId) => {
    try {
        const version = await prisma.documentVersion.findUnique({
            where: { id: documentVersionId }
        });

        if (!version) {
            throw new Error(`DocumentVersion ${documentVersionId} not found.`);
        }

        if (version.mimeType !== 'application/pdf') {
            console.log(`DocumentVersion ${documentVersionId} is not a PDF. Skipping extraction.`);
            return null;
        }

        if (!fs.existsSync(version.filePath)) {
            throw new Error(`File not found at path: ${version.filePath}`);
        }
        
        const dataBuffer = fs.readFileSync(version.filePath);

        // Read the ENTIRE document
        const data = await pdf(dataBuffer);
        
        const rawText = data.text;
        const cleanedText = rawText.replace(/\s+/g, ' ').trim();

        // Gemini AI Extraction
        const prompt = 'You are an expert data organizer. Read this ENTIRE document. Your task is to reorganize ALL of the information from the document into a structured format without summarizing or losing any details. Create logical clusters (e.g., "Document Profile", "Main Content", "Methodology", "Results", etc. depending on what fits best) and place all data into these clusters. Return ONLY a valid JSON object where the outer keys are the cluster names, and the inner keys are the specific data points or sections, with the values containing the complete details. Use camelCase for inner keys. Do NOT wrap in markdown.\n\nText: ' + cleanedText;
        
        let dynamicMetadata = {};
        let extractedTitle = version.filename.replace(/\.[^/.]+$/, "");
        const preliminarySummary = cleanedText.substring(0, 500); // Just a quick snippet for DB

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3.6-flash',
                contents: prompt,
            });
            
            let jsonText = response.text.trim();
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.replace(/^```json\n?/, '').replace(/```$/, '').trim();
            } else if (jsonText.startsWith('```')) {
                jsonText = jsonText.replace(/^```\n?/, '').replace(/```$/, '').trim();
            }
            
            dynamicMetadata = JSON.parse(jsonText);
            
            if (dynamicMetadata.title) {
                extractedTitle = dynamicMetadata.title;
            }
            
        } catch (aiError) {
            console.error('AI Extraction failed, falling back to basic data:', aiError);
            dynamicMetadata = { extractionError: "AI failed to extract metadata. " + aiError.message };
        }

        const contentData = {
            referenceCode: dynamicMetadata.referenceCode || '',
            sourceUrl: '',
            type: dynamicMetadata.type || '',
            title: extractedTitle,
            keywords: '',
            descriptionText: preliminarySummary,
            dynamicMetadata: dynamicMetadata
        };

        // Save to Database
        const newContent = await prisma.content.upsert({
            where: { documentVersionId: version.id },
            update: {
                title: contentData.title,
                descriptionText: contentData.descriptionText,
                status: 'DRAFT',
                dynamicMetadata: contentData.dynamicMetadata
            },
            create: {
                documentVersionId: version.id,
                title: contentData.title,
                descriptionText: contentData.descriptionText,
                status: 'DRAFT',
                dynamicMetadata: contentData.dynamicMetadata
            }
        });

        // Automate PDF Generation
        await pdfGeneratorService.generateCleanPDF(version.id, contentData);

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
