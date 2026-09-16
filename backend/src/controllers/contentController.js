const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Saves a new human-edited ContentVersion snapshot.
 */
const saveContentVersion = async (req, res) => {
    try {
        const { id } = req.params; // contentId
        const { title, type, referenceCode, keywords, descriptionText, sourceUrl } = req.body;

        if (!id) {
            return res.status(400).json({ error: 'contentId is required' });
        }

        // 1. Fetch latest version number to increment it
        const latestVersion = await prisma.contentVersion.findFirst({
            where: { contentId: parseInt(id) },
            orderBy: { versionNumber: 'desc' }
        });

        const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

        // 2. Strict Versioning Rule: create new snapshot instead of updating
        const newVersion = await prisma.contentVersion.create({
            data: {
                contentId: parseInt(id),
                versionNumber: nextVersionNumber,
                title,
                type,
                referenceCode,
                keywords,
                descriptionText,
                sourceUrl,
                editorId: req.user.userId
            }
        });

        res.status(201).json(newVersion);
    } catch (error) {
        console.error('Error saving content version:', error);
        res.status(500).json({ error: 'Failed to save content version.' });
    }
};

module.exports = {
    saveContentVersion
};
