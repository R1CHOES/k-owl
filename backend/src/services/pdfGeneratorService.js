const PDFDocument = require('pdfkit-table');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ensureDirectoryExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

const formatKeyToTitleCase = (key) => {
    const result = key.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
};

const generateCleanPDF = async (versionId, contentData) => {
    return new Promise(async (resolve, reject) => {
        try {
            const generatedDir = path.join(__dirname, '../../uploads/generated');
            ensureDirectoryExists(generatedDir);
            
            const version = await prisma.documentVersion.findUnique({ where: { id: versionId } });
            const versionNum = version ? version.versionNumber : 1;
            const safeTitle = (contentData.title || 'Document').replace(/[<>:"/\\|?*]+/g, '').trim();
            const fileName = `${safeTitle}_Content_v${versionNum}.pdf`;
            const filePath = path.join(generatedDir, fileName);
            
            // Use landscape A4 to fit the wide table layout (Excel style)
            const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
            const writeStream = fs.createWriteStream(filePath);
            
            doc.pipe(writeStream);
            
            // Draw professional header
            doc.font('Helvetica-Bold')
               .fontSize(18)
               .text('AI Report: ' + (contentData.title || 'Document'), { align: 'center' });
               
            doc.moveDown(2);
            
            const metadata = contentData.dynamicMetadata || {};
            const clusters = Object.keys(metadata);
            
            if (clusters.length > 0) {
                // We will build a unified "Excel-style" table
                const tableRows = [];
                
                for (const clusterName of clusters) {
                    const innerData = metadata[clusterName];
                    if (innerData && typeof innerData === 'object') {
                        for (const [key, value] of Object.entries(innerData)) {
                            const titleKey = formatKeyToTitleCase(key);
                            const displayValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
                            
                            tableRows.push({
                                cluster: String(clusterName).toUpperCase(),
                                key: titleKey,
                                details: displayValue
                            });
                        }
                    }
                }
                
                const table = {
                    headers: [
                        { label: "Cluster Category", property: "cluster", width: 120 },
                        { label: "Key / Section", property: "key", width: 120 },
                        { label: "Complete Details", property: "details", width: 520 } // Wide column for the long text
                    ],
                    datas: tableRows
                };
                
                console.log(`Generating PDF with ${tableRows.length} rows...`);

                await doc.table(table, {
                    prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
                    prepareRow: (row, indexColumn, indexRow, rectRow) => {
                        doc.font("Helvetica").fontSize(10);
                    },
                });
                
            } else {
                // Fallback if metadata is completely empty
                doc.font('Helvetica-Oblique')
                   .fontSize(12)
                   .text('No dynamic metadata was extracted for this document.');
            }
               
            doc.end();
            
            writeStream.on('finish', () => {
                console.log(`Generated clean PDF report for Version ID: ${versionId}`);
                resolve(filePath);
            });
            
            writeStream.on('error', (err) => {
                reject(err);
            });
            
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = {
    generateCleanPDF
};
