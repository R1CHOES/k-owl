"""
ocr_extractor.py - Backend OCR extraction for scanned PDFs.

Uses PyMuPDF (fitz) for fast digital text extraction, and falls back to
pytesseract OCR for scanned/image-based PDFs.

Usage:
    python ocr_extractor.py "C:\path\to\document.pdf"

Outputs extracted text to stdout. The Node.js worker captures this via
child_process.execFile().

Requirements:
    pip install PyMuPDF pytesseract Pillow

    Tesseract OCR engine must be installed on the system.
    Download from: https://github.com/UB-Mannheim/tesseract/wiki
    Ensure 'tesseract' is on the system PATH, or set the path below.
"""

import sys
import os

try:
    import fitz  # PyMuPDF
except ImportError:
    print("ERROR: PyMuPDF (fitz) is not installed. Run: pip install PyMuPDF", file=sys.stderr)
    sys.exit(1)

# --- Configuration ---
# If tesseract is not on PATH, uncomment and set the path:
# import pytesseract
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# Maximum pages to OCR (to prevent extremely long processing times)
MAX_OCR_PAGES = 10

# Minimum character threshold for digital text (below this, try OCR)
MIN_TEXT_THRESHOLD = 50


def extract_digital_text(doc):
    """
    Attempt to extract embedded/digital text from a PDF using PyMuPDF.
    This is very fast and works for all non-scanned PDFs.
    """
    text_parts = []
    for page_num in range(len(doc)):
        page = doc[page_num]
        page_text = page.get_text("text")
        if page_text:
            text_parts.append(page_text.strip())
    return "\n\n".join(text_parts)


def extract_ocr_text(doc):
    """
    For scanned PDFs: render each page as an image and run pytesseract OCR.
    Falls back gracefully if pytesseract is not available.
    """
    try:
        import pytesseract
        from PIL import Image
        import io
    except ImportError as e:
        print(f"WARNING: OCR libraries not available ({e}). Install with: pip install pytesseract Pillow", file=sys.stderr)
        return ""

    text_parts = []
    pages_to_scan = min(len(doc), MAX_OCR_PAGES)

    print(f"INFO: Running OCR on {pages_to_scan} page(s)...", file=sys.stderr)

    for page_num in range(pages_to_scan):
        print(f"INFO: OCR scanning page {page_num + 1}/{pages_to_scan}...", file=sys.stderr)
        page = doc[page_num]

        # Render page at 300 DPI for good OCR accuracy
        # zoom = 300/72 ≈ 4.17
        zoom_matrix = fitz.Matrix(4.0, 4.0)
        pixmap = page.get_pixmap(matrix=zoom_matrix)

        # Convert pixmap to PIL Image
        img_data = pixmap.tobytes("png")
        image = Image.open(io.BytesIO(img_data))

        # Run pytesseract
        page_text = pytesseract.image_to_string(image, lang='eng')
        if page_text and page_text.strip():
            text_parts.append(page_text.strip())

    return "\n\n".join(text_parts)


def main():
    if len(sys.argv) < 2:
        print("ERROR: No PDF path provided.", file=sys.stderr)
        print("Usage: python ocr_extractor.py <path_to_pdf>", file=sys.stderr)
        sys.exit(1)

    pdf_path = sys.argv[1]

    if not os.path.isfile(pdf_path):
        print(f"ERROR: File not found: {pdf_path}", file=sys.stderr)
        sys.exit(1)

    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        print(f"ERROR: Could not open PDF: {e}", file=sys.stderr)
        sys.exit(1)

    if len(doc) == 0:
        print("ERROR: PDF has no pages.", file=sys.stderr)
        doc.close()
        sys.exit(1)

    # Step 1: Try fast digital text extraction
    digital_text = extract_digital_text(doc)

    if len(digital_text.strip()) >= MIN_TEXT_THRESHOLD:
        # Digital PDF — text was embedded. Output and exit.
        print(digital_text, end="")
        doc.close()
        sys.exit(0)

    # Step 2: Digital text was too short — likely a scanned PDF. Try OCR.
    print(f"INFO: Digital text too short ({len(digital_text.strip())} chars). Attempting OCR...", file=sys.stderr)
    ocr_text = extract_ocr_text(doc)

    doc.close()

    if ocr_text.strip():
        print(ocr_text, end="")
        sys.exit(0)
    else:
        # Both methods failed
        combined = digital_text.strip()
        if combined:
            print(combined, end="")
        else:
            print("WARNING: No text could be extracted from this PDF.", end="")
        sys.exit(0)


if __name__ == "__main__":
    main()
