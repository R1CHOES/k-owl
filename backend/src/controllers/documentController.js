const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');
const fs = require('fs');
const contentExtractionService = require('../services/contentExtractionService');
const convertapi = require('convertapi')(process.env.CONVERT_API_SECRET);

/**
 * Handles document upload, deduplication, and database entry creation.
 */
const uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { agencyId } = req.body;

        if (!agencyId) {
            fs.unlinkSync(req.file.path); // clean up file
            return res.status(400).json({ error: 'agencyId is required' });
        }

        // 0. Convert Word documents to PDF
        if (req.file.mimetype === 'application/msword' || req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            try {
                console.log(`Starting conversion for ${req.file.originalname}...`);
                const fileExt = req.file.originalname.split('.').pop().toLowerCase();
                const result = await convertapi.convert('pdf', { File: req.file.path }, fileExt);
                const convertedFilePath = req.file.path + ".pdf";
                await result.file.save(convertedFilePath);

                fs.unlinkSync(req.file.path); // Delete the original .docx file

                // Override req.file variables
                req.file.path = convertedFilePath;
                req.file.mimetype = 'application/pdf';
                req.file.originalname = req.file.originalname.replace(/\.[^/.]+$/, "") + ".pdf";

                // Update file size property
                const stats = fs.statSync(req.file.path);
                req.file.size = stats.size;

                console.log(`Successfully converted to PDF: ${req.file.originalname}`);
            } catch (conversionError) {
                console.error('Document conversion failed:', conversionError);
                if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                return res.status(500).json({ error: 'Document conversion failed. Please try again.' });
            }
        }

        // 1. Generate SHA-256 hash of the file to prevent duplicates
        const fileBuffer = fs.readFileSync(req.file.path);
        const hashSum = crypto.createHash('sha256');
        hashSum.update(fileBuffer);
        const fileHash = hashSum.digest('hex');

        // 2. Check if a DocumentVersion with this hash already exists (ignore archived)
        const existingVersion = await prisma.documentVersion.findFirst({
            where: { fileHash },
            include: { document: true }
        });

        if (existingVersion) {
            if (existingVersion.document && existingVersion.document.isArchived) {
                // Restore the archived document!
                const restoredDocument = await prisma.document.update({
                    where: { id: existingVersion.document.id },
                    data: { isArchived: false, status: 'PENDING_EXTRACTION' },
                    include: { versions: true }
                });
                fs.unlinkSync(req.file.path); // clean up duplicate uploaded file

                // Hook into the CMS Pipeline for restored document to ensure PDF is generated
                try {
                    await contentExtractionService.extractAndOrganize(existingVersion.id);
                } catch (extractionError) {
                    console.error('Extraction Pipeline failed for restored document:', extractionError);
                }

                return res.status(200).json(restoredDocument);
            } else {
                // Delete the newly uploaded duplicate file from the server
                fs.unlinkSync(req.file.path);
                return res.status(400).json({
                    error: 'This exact document has already been uploaded.'
                });
            }
        }

        // 3. Create the document record in the database
        const newDocument = await prisma.document.create({
            data: {
                agencyId: parseInt(agencyId),
                status: 'PENDING_EXTRACTION',
                versions: {
                    create: {
                        versionNumber: 1,
                        filename: req.file.originalname,
                        filePath: req.file.path,
                        mimeType: req.file.mimetype,
                        fileSizeBytes: req.file.size,
                        fileHash: fileHash,
                        uploaderId: req.user.userId
                    }
                }
            },
            include: { versions: true }
        });

        // 4. Hook into the CMS Pipeline: Automated Content Extraction
        // We DO NOT await this. It runs in the background so the frontend doesn't hang!
        contentExtractionService.extractAndOrganize(newDocument.versions[0].id).catch(extractionError => {
            console.error('Extraction Pipeline failed for newly uploaded document:', extractionError);
        });

        res.status(201).json(newDocument);

    } catch (error) {
        console.error('Error uploading document:', error);
        // Clean up the file if an error occurred during DB insertion
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Internal server error during upload.' });
    }
};

/**
 * Fetch all documents with their relations
 */
const getAllDocuments = async (req, res) => {
    try {
        let whereClause = { isArchived: false };
        if (req.user && (req.user.roleSlug === 'focal_person' || req.user.roleSlug === 'agency_admin')) {
            whereClause.agencyId = req.user.agencyId;
        }

        const documents = await prisma.document.findMany({
            where: whereClause,
            include: {
                agency: true,
                versions: {
                    include: { uploader: true, content: true },
                    orderBy: { versionNumber: 'desc' },
                    take: 1
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(documents);
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Update document metadata and optionally replace the file
 */
const updateDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { agencyId, status } = req.body;

        let updateData = {
            ...(agencyId && { agencyId: parseInt(agencyId) }),
            ...(status && { status })
        };

        if (req.file) {
            // New file uploaded for replacement
            if (req.file.mimetype === 'application/msword' || req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                try {
                    console.log(`Starting conversion for ${req.file.originalname}...`);
                    const fileExt = req.file.originalname.split('.').pop().toLowerCase();
                    const result = await convertapi.convert('pdf', { File: req.file.path }, fileExt);
                    const convertedFilePath = req.file.path + ".pdf";
                    await result.file.save(convertedFilePath);

                    fs.unlinkSync(req.file.path); // Delete the original .docx file

                    // Override req.file variables
                    req.file.path = convertedFilePath;
                    req.file.mimetype = 'application/pdf';
                    req.file.originalname = req.file.originalname.replace(/\.[^/.]+$/, "") + ".pdf";

                    // Update file size property
                    const stats = fs.statSync(req.file.path);
                    req.file.size = stats.size;

                    console.log(`Successfully converted to PDF: ${req.file.originalname}`);
                } catch (conversionError) {
                    console.error('Document conversion failed:', conversionError);
                    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                    return res.status(500).json({ error: 'Document conversion failed. Please try again.' });
                }
            }

            const fileBuffer = fs.readFileSync(req.file.path);
            const hashSum = crypto.createHash('sha256');
            hashSum.update(fileBuffer);
            const fileHash = hashSum.digest('hex');

            // 1. Check for duplicates (Polite Check)
            const existingDoc = await prisma.document.findFirst({
                where: {
                    fileHash: fileHash,
                    isArchived: false // Ignore files that have been sent to the archive
                }
            });

            if (existingDoc) {
                // Delete the duplicate file from the hard drive to save space
                const fs = require('fs');
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                // Return a polite 400 error to the frontend
                return res.status(400).json({
                    message: "Duplicate File Detected: This document already exists in the system."
                });
            }


            // Get the old document so we can delete its physical file
            const oldDocument = await prisma.document.findUnique({ where: { id: parseInt(id) } });
            if (oldDocument && fs.existsSync(oldDocument.filePath)) {
                // Delete old file from server
                fs.unlinkSync(oldDocument.filePath);
            }

            // Add new file properties to update data
            updateData = {
                ...updateData,
                filename: req.file.originalname,
                filePath: req.file.path,
                mimeType: req.file.mimetype,
                fileSizeBytes: req.file.size,
                fileHash: fileHash,
            };
        }

        const updatedDocument = await prisma.document.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                agency: true
            }
        });

        res.json(updatedDocument);
    } catch (error) {
        console.error('Error updating document:', error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Soft deletes (archives) a document.
 */
const archiveDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const document = await prisma.document.update({
            where: { id: parseInt(id) },
            data: { isArchived: true }
        });
        res.json(document);
    } catch (error) {
        console.error('Error archiving document:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    uploadDocument,
    getAllDocuments,
    updateDocument,
    archiveDocument
};
