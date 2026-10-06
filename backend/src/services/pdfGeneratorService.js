const PDFDocument = require('pdfkit');
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

const drawTable = (doc, headers, rows) => {
    const startX = doc.x;
    const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colWidth = usableWidth / headers.length;
    
    doc.font('Helvetica-Bold').fontSize(9);
    let currentY = doc.y;
    
    // Draw Headers
    headers.forEach((h, i) => {
        doc.text(h, startX + (i * colWidth) + 5, currentY + 5, { width: colWidth - 10, align: 'left' });
    });
    
    currentY = doc.y + 10;
    doc.moveTo(startX, currentY).lineTo(startX + usableWidth, currentY).stroke('#000');
    
    // Draw Rows
    doc.font('Helvetica').fontSize(8);
    for (const row of rows) {
        const rowStartY = currentY + 5;
        let maxRowHeight = 0;
        
        row.forEach((cell, i) => {
            const x = startX + (i * colWidth) + 5;
            doc.text(cell, x, rowStartY, { width: colWidth - 10, align: 'left' });
            const height = doc.y - rowStartY;
            if (height > maxRowHeight) maxRowHeight = height;
        });
        
        currentY = rowStartY + maxRowHeight + 5;
        
        if (currentY > doc.page.height - doc.page.margins.bottom - 40) {
            doc.addPage();
            currentY = doc.y;
        } else {
            doc.moveTo(startX, currentY).lineTo(startX + usableWidth, currentY).stroke('#ccc');
        }
    }
    doc.moveDown(1);
};

const generateCleanPDF = async (versionId, contentData) => {
    return new Promise(async (resolve, reject) => {
        try {
            const generatedDir = path.join(__dirname, '../../uploads/generated');
            ensureDirectoryExists(generatedDir);
            
            const version = await prisma.documentVersion.findUnique({ where: { id: versionId } });
            const versionNum = version ? version.versionNumber : 1;
            const safeTitle = (contentData.title || 'Document')
                .replace(/[<>:"/\\|?*]+/g, '')
                .trim()
                .substring(0, 50); // Prevent extremely long filenames
            const fileName = `${safeTitle}_Content_v${versionNum}.pdf`;
            const filePath = path.join(generatedDir, fileName);
            
            // Landscape A4 for tables
            const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
            const writeStream = fs.createWriteStream(filePath);
            
            doc.pipe(writeStream);
            
            doc.font('Helvetica-Bold').fontSize(16).text('Extracted Data Report', { align: 'center' });
            doc.font('Helvetica').fontSize(11).text(contentData.title || 'Untitled Document', { align: 'center' });
            doc.moveDown(2);
            
            // Draw Metadata Block
            const metadata = contentData.dynamicMetadata || {};
            const docInfo = metadata["Document Info"] || {};
            doc.font('Helvetica-Bold').fontSize(12).text('Document Metadata', { underline: true });
            doc.moveDown(0.5);
            
            for (const [key, value] of Object.entries(docInfo)) {
                if (!value) continue;
                doc.font('Helvetica-Bold').fontSize(10).text(`${formatKeyToTitleCase(key)}: `, { continued: true });
                doc.font('Helvetica').text(String(value));
                doc.moveDown(0.2);
            }
            doc.moveDown(1.5);
            
            // Draw Body Content
            doc.font('Helvetica-Bold').fontSize(12).text('Extracted Content', { underline: true });
            doc.moveDown(1);
            
            if (contentData.descriptionText) {
                const lines = contentData.descriptionText.split('\n');
                let isTable = false;
                let tableHeaders = [];
                let tableRows = [];
                
                for (const line of lines) {
                    if (line.trim().startsWith('|')) {
                        isTable = true;
                        if (line.includes('---')) continue;
                        const cells = line.split('|').slice(1, -1).map(s => s.trim().replace(/<br>/g, ' '));
                        if (tableHeaders.length === 0) tableHeaders = cells;
                        else tableRows.push(cells);
                    } else {
                        if (isTable) {
                            drawTable(doc, tableHeaders, tableRows);
                            isTable = false;
                            tableHeaders = [];
                            tableRows = [];
                            doc.moveDown(1);
                        }
                        
                        if (line.startsWith('### ')) {
                            doc.moveDown(0.5);
                            doc.font('Helvetica-Bold').fontSize(11).text(line.replace('### ', ''));
                            doc.moveDown(0.5);
                        } else if (line.trim() !== '') {
                            doc.font('Helvetica').fontSize(10).text(line, { align: 'justify' });
                            doc.moveDown(0.5);
                        }
                    }
                }
                if (isTable) drawTable(doc, tableHeaders, tableRows);
            } else {
                doc.font('Helvetica-Oblique').fontSize(10).text('No body text extracted.');
            }
               
            doc.end();
            
            writeStream.on('finish', () => {
                console.log(`Generated clean PDF report for Version ID: ${versionId}`);
                resolve(filePath);
            });
            writeStream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { generateCleanPDF };
