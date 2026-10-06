const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const extractAndOrganize = async (documentVersionId) => {
    try {
        const version = await prisma.documentVersion.findUnique({
            where: { id: documentVersionId }
        });

        if (!version) {
            throw new Error(`DocumentVersion ${documentVersionId} not found.`);
        }

        // We update the Document status to PENDING_EXTRACTION. 
        // The extractionWorker.js will pick this up automatically in the background!
        await prisma.document.update({
            where: { id: version.documentId },
            data: { status: 'PENDING_EXTRACTION' }
        });

        console.log(`Document ${version.documentId} successfully queued for background processing.`);
        return { message: "Queued for background AI processing." };

    } catch (error) {
        console.error('Queueing Service Error:', error);
        throw error;
    }
};

module.exports = {
    extractAndOrganize
};
