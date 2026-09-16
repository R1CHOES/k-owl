const PDFDocument = require('pdfkit-table');
const fs = require('fs');
const path = require('path');

const ensureDirectoryExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

const generateCleanPDF = async (versionId, contentData) => {
    return new Promise(async (resolve, reject) => {
        try {
            const generatedDir = path.join(__dirname, '../../uploads/generated');
            ensureDirectoryExists(generatedDir);
            
            const filePath = path.join(generatedDir, `organized_${versionId}.pdf`);
            
            // Use landscape A4 to fit the wide table
            const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
            const writeStream = fs.createWriteStream(filePath);
            
            doc.pipe(writeStream);
            
            // Add bold header
            doc.font('Helvetica-Bold')
               .fontSize(18)
               .text('Organized System Report', { align: 'center' });
               
            doc.moveDown(2);
            
            const table = {
                headers: [
                    { label: "Item No.", property: "itemNo", width: 60, align: "center" },
                    { label: "Source", property: "source", width: 60 },
                    { label: "Type", property: "type", width: 60 },
                    { label: "Title", property: "title", width: 100 },
                    { label: "Keywords", property: "keywords", width: 80 },
                    { label: "Description", property: "description", width: 160 },
                    { label: "Contact Details", property: "contact", width: 60 },
                    { label: "Date Posted", property: "datePosted", width: 50 },
                    { label: "Checker Notes", property: "langNotes", width: 50 },
                    { label: "Date Processed", property: "dateProcessed", width: 50 },
                    { label: "Review Date", property: "reviewDate", width: 50 }
                ],
                rows: [
                    [
                        contentData.referenceCode || "",
                        contentData.sourceUrl || "",
                        contentData.type || "",
                        contentData.title || "",
                        contentData.keywords || "",
                        (contentData.descriptionText || "").substring(0, 300) + (contentData.descriptionText?.length > 300 ? "..." : ""),
                        "",
                        "",
                        "",
                        "",
                        ""
                    ]
                ]
            };

            await doc.table(table, {
                prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
                prepareRow: (row, indexColumn, indexRow, rectRow) => {
                    doc.font("Helvetica").fontSize(8);
                },
            });
               
            doc.end();
            
            writeStream.on('finish', () => {
                console.log(`Generated clean PDF table for Version ID: ${versionId}`);
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
