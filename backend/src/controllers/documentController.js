const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');
const fs = require('fs');
const contentExtractionService = require('../services/contentExtractionService');

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

        // 1. Generate SHA-256 hash of the file to prevent duplicates
        const fileBuffer = fs.readFileSync(req.file.path);
        const hashSum = crypto.createHash('sha256');
        hashSum.update(fileBuffer);
        const fileHash = hashSum.digest('hex');

        // 2. Check if a DocumentVersion with this hash already exists
        const existingVersion = await prisma.documentVersion.findUnique({
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
        try {
            if (newDocument.versions && newDocument.versions.length > 0) {
                const newVersionId = newDocument.versions[0].id;
                // Await the extraction as requested, but catch errors to prevent upload failure
                await contentExtractionService.extractAndOrganize(newVersionId);
            }
        } catch (extractionError) {
            console.error('Extraction Pipeline failed for newly uploaded document:', extractionError);
            // We DO NOT throw here. The upload was successful, just the extraction failed/pending.
        }

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
        if (req.user && req.user.roleSlug === 'agency-focal-person') {
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
            const fileBuffer = fs.readFileSync(req.file.path);
            const hashSum = crypto.createHash('sha256');
            hashSum.update(fileBuffer);
            const fileHash = hashSum.digest('hex');

            // Check duplicate
            const existingDoc = await prisma.document.findUnique({
                where: { fileHash }
            });

            // Make sure the existing doc isn't the one we are currently updating!
            if (existingDoc && existingDoc.id !== parseInt(id)) {
                fs.unlinkSync(req.file.path);
                return res.status(400).json({ error: 'This exact document already exists elsewhere.' });
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
