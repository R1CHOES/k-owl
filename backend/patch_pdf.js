const fs = require('fs');

let code = fs.readFileSync('src/services/pdfGeneratorService.js', 'utf8');

const replacement = `
                // Draw Body Content (parsed from Markdown)
                doc.font('Helvetica-Bold').fontSize(14).text('Extracted Content', { underline: true });
                doc.moveDown(1);
                
                if (contentData.descriptionText) {
                    const lines = contentData.descriptionText.split('\\n');
                    
                    let isTable = false;
                    let tableHeaders = [];
                    let tableRows = [];
                    
                    for (const line of lines) {
                        if (line.trim().startsWith('|')) {
                            isTable = true;
                            if (line.includes('---')) continue; // Skip separator
                            const cells = line.split('|').slice(1, -1).map(s => s.trim().replace(/<br>/g, ' '));
                            if (tableHeaders.length === 0) {
                                tableHeaders = cells;
                            } else {
                                tableRows.push(cells);
                            }
                        } else {
                            // If we just finished a table, draw it
                            if (isTable) {
                                drawTable(doc, tableHeaders, tableRows);
                                isTable = false;
                                tableHeaders = [];
                                tableRows = [];
                                doc.moveDown(1);
                            }
                            
                            if (line.startsWith('### ')) {
                                doc.moveDown(0.5);
                                doc.font('Helvetica-Bold').fontSize(12).text(line.replace('### ', ''));
                                doc.moveDown(0.5);
                            } else if (line.trim() !== '') {
                                doc.font('Helvetica').fontSize(10).text(line, { align: 'justify' });
                                doc.moveDown(0.5);
                            }
                        }
                    }
                    
                    // If file ends with a table
                    if (isTable) {
                        drawTable(doc, tableHeaders, tableRows);
                    }
                }

                // Table drawing helper
                function drawTable(doc, headers, rows) {
                    const startX = doc.x;
                    const startY = doc.y;
                    const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
                    const colWidth = usableWidth / headers.length;
                    
                    doc.font('Helvetica-Bold').fontSize(10);
                    let currentY = doc.y;
                    
                    // Draw Headers
                    headers.forEach((h, i) => {
                        doc.text(h, startX + (i * colWidth) + 5, currentY + 5, { width: colWidth - 10, align: 'left' });
                    });
                    
                    currentY = doc.y + 10;
                    doc.moveTo(startX, currentY).lineTo(startX + usableWidth, currentY).stroke();
                    
                    // Draw Rows
                    doc.font('Helvetica').fontSize(9);
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
                        
                        // Page break logic for long tables
                        if (currentY > doc.page.height - doc.page.margins.bottom - 50) {
                            doc.addPage();
                            currentY = doc.y;
                        } else {
                            doc.moveTo(startX, currentY).lineTo(startX + usableWidth, currentY).stroke('#ccc');
                        }
                    }
                    doc.moveDown(1);
                }
`;

code = code.replace(
  /\/\/ Draw Body Content \(parsed from Markdown\)[\s\S]*?(?=\/\/ Add Tracking ID and Watermarks)/,
  replacement
);

fs.writeFileSync('src/services/pdfGeneratorService.js', code);
