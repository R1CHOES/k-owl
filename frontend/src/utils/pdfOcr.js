import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import Tesseract from 'tesseract.js';

// Setup PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
).toString();

/**
 * Reads a File (PDF) and extracts text. 
 * If it's a scanned PDF (very little text), it runs Tesseract OCR on the first few pages.
 * @param {File} file 
 * @param {Function} setStatus Optional callback to update UI loading state (e.g. "Scanning page 1...")
 * @returns {Promise<string>} The extracted text
 */
export const extractTextWithOcrFallback = async (file, setStatus = () => {}) => {
    try {
        setStatus('Reading document format...');
        const arrayBuffer = await file.arrayBuffer();
        const typedArray = new Uint8Array(arrayBuffer);
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
        
        let digitalText = "";
        
        // Try extracting digital text first
        for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(" ");
            digitalText += pageText + "\n";
        }
        
        // If it has enough digital text, return it immediately (fast path!)
        if (digitalText.trim().length > 100) {
            setStatus('Digital text found.');
            return digitalText;
        }
        
        // If we get here, it's likely a scanned document. Initiate OCR.
        setStatus('Scanned document detected. Initiating Smart OCR (this may take a minute)...');
        let ocrText = "";
        
        // Limit OCR to first 3 pages to save the user's browser from crashing
        const pagesToScan = Math.min(pdf.numPages, 3);
        
        for (let i = 1; i <= pagesToScan; i++) {
            setStatus(`Scanning page ${i} of ${pagesToScan} with AI Vision...`);
            const page = await pdf.getPage(i);
            
            // Render page to a canvas
            const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for better OCR accuracy
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            await page.render({ canvasContext: context, viewport: viewport }).promise;
            
            // Convert canvas to base64 image
            const imgData = canvas.toDataURL('image/png');
            
            // Run Tesseract OCR on the image
            const result = await Tesseract.recognize(imgData, 'eng', {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        setStatus(`Scanning page ${i}: ${Math.round(m.progress * 100)}%`);
                    }
                }
            });
            
            ocrText += result.data.text + "\n\n";
        }
        
        setStatus('OCR Complete.');
        return ocrText;
        
    } catch (error) {
        console.error("OCR Extraction Error:", error);
        setStatus('Failed to read document.');
        return ""; // Return empty string so backend handles it gracefully
    }
};
