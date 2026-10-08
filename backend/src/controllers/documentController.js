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

        console.log("=== UPLOAD RECEIVED ===");

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
                fs.unlinkSync(req.file.path);



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
                uploadedById: req.user.userId,
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
                uploadedBy: true,
                qaApprovedBy: true,
                contentApprovedBy: true,
                versions: {
                    include: { uploader: true, content: true },
                    orderBy: { versionNumber: 'desc' },
                    take: 1
                },
                reviews: {
                    include: { remarks: { include: { user: true } } },
                    orderBy: { reviewDate: 'desc' }
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

        if (status) {
            if (req.user && req.user.roleSlug === 'qa') {
                updateData.qaApprovedById = req.user.userId;
            } else if (req.user && req.user.roleSlug === 'content_approver') {
                updateData.contentApprovedById = req.user.userId;
            }
        }

        if (req.file) {
            // New file uploaded for replacement
            

            const crypto = require('crypto');
            const fileBuffer = fs.readFileSync(req.file.path);
            const hashSum = crypto.createHash('sha256');
            hashSum.update(fileBuffer);
            const fileHash = hashSum.digest('hex');

            // 1. Check for duplicates in DocumentVersion
            const existingVersion = await prisma.documentVersion.findFirst({
                where: {
                    fileHash: fileHash,
                    document: { isArchived: false }
                }
            });

            if (existingVersion) {
                if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                return res.status(400).json({
                    message: "Duplicate File Detected: This document already exists in the system."
                });
            }

            // 2. Get highest version number
            const latestVersion = await prisma.documentVersion.findFirst({
                where: { documentId: parseInt(id) },
                orderBy: { versionNumber: 'desc' }
            });
            const nextVersion = latestVersion ? latestVersion.versionNumber + 1 : 1;

            // 3. Create new DocumentVersion
            await prisma.documentVersion.create({
                data: {
                    documentId: parseInt(id),
                    versionNumber: nextVersion,
                    filename: req.file.originalname,
                    filePath: req.file.path,
                    fileSizeBytes: req.file.size,
                    mimeType: req.file.mimetype,
                    fileHash: fileHash,
                    uploaderId: req.user.userId
                }
            });

            // 4. Force AI Re-extraction by resetting status
            updateData.status = 'PENDING_EXTRACTION';
        }

        const updatedDocument = await prisma.document.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                agency: true,
                versions: {
                    orderBy: { versionNumber: 'desc' },
                    take: 1
                }
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

const getDocumentById = async (req, res) => {
    try {
        const { id } = req.params;
        const document = await prisma.document.findUnique({
            where: { id: parseInt(id) },
            include: {
                agency: true,
                uploadedBy: true,
                qaApprovedBy: true,
                contentApprovedBy: true,
                versions: {
                    include: { 
                        uploader: true, 
                        content: {
                            include: {
                                versions: true
                            }
                        } 
                    },
                    orderBy: { versionNumber: 'desc' }
                }
            }
        });
        
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        res.json(document);
    } catch (error) {
        console.error('Error fetching document by ID:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const addReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { stage, decision, remark } = req.body;
        const userId = req.user.userId;

        // 1. Update document status
        const updatedDocument = await prisma.document.update({
            where: { id: parseInt(id) },
            data: { status: decision }
        });

        // 2. Create ContentReview and ContentRemark
        const review = await prisma.contentReview.create({
            data: {
                stage: stage,
                decision: decision,
                documentId: parseInt(id),
                reviewerId: userId,
                remarks: remark ? {
                    create: {
                        remark: remark,
                        userId: userId
                    }
                } : undefined
            }
        });

        res.json({ document: updatedDocument, review });
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {

    uploadDocument,
    getAllDocuments,
    updateDocument,
    archiveDocument,
    getDocumentById,
    addReview
};
