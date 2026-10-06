const fs = require('fs'); 
let text = fs.readFileSync('C:/Users/Admin/Downloads/k-owl/backend/src/workers/extractionWorker.js', 'utf8'); 

const startMarker = '// extractTextWithNodeTesseract';
const startIdx = text.indexOf(startMarker); 
const endIdx = text.lastIndexOf('// =================================', text.indexOf('// processDocument')); 

let newText = text.substring(0, text.indexOf('\n', startIdx) + 1) + 
`// ============================================================================
/**
 * Uses Python (pymupdf) to generate images, then tesseract.js to read text.
 * This avoids the need for Node Canvas or external Tesseract.exe binaries.
 */
const Tesseract = require('tesseract.js');
const crypto = require('crypto');
const os = require('os');
const path = require('path');

const extractTextWithNodeTesseract = async (pdfPath) => {
    return new Promise((resolve, reject) => {
        console.log(\`[Worker] Generating images via Python for: \${pdfPath}\`);
        const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
        const extractScript = path.join(__dirname, '../../scripts/extract_images.py');
        const tempDir = path.join(os.tmpdir(), \`ocr_\${crypto.randomBytes(8).toString('hex')}\`);

        execFile(pythonCmd, [extractScript, pdfPath, tempDir], {
            timeout: 2 * 60 * 1000
        }, async (error, stdout, stderr) => {
            if (error) {
                console.error(\`[Worker] Python Image Extraction failed:\`, error.message);
                return resolve('');
            }
            const imagePaths = stdout.trim().split('\\n').filter(p => p.trim() !== '' && !p.startsWith('ERROR') && !p.startsWith('INFO'));
            if (imagePaths.length === 0) return resolve('');
            
            console.log(\`[Worker] Python generated \${imagePaths.length} images. Starting Tesseract.js OCR...\`);
            let fullText = '';
            try {
                const worker = await Tesseract.createWorker('eng');
                for (let i = 0; i < imagePaths.length; i++) {
                    console.log(\`[Worker] OCR scanning page \${i + 1}/\${imagePaths.length}...\`);
                    const ret = await worker.recognize(imagePaths[i].trim());
                    fullText += ret.data.text + '\\n\\n';
                }
                await worker.terminate();
                try {
                    for (const img of imagePaths) fs.unlinkSync(img.trim());
                    fs.rmdirSync(tempDir);
                } catch (e) {}
                resolve(fullText);
            } catch (err) {
                console.error('[Worker] Tesseract error:', err);
                resolve('');
            }
        });
    });
};

` + text.substring(endIdx); 

fs.writeFileSync('C:/Users/Admin/Downloads/k-owl/backend/src/workers/extractionWorker.js', newText);
