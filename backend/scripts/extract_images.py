import sys
import os
import pymupdf  # fitz

def main():
    if len(sys.argv) < 3:
        print("ERROR: Usage: python extract_images.py <pdf_path> <output_dir>")
        sys.exit(1)

    pdf_path = sys.argv[1]
    output_dir = sys.argv[2]

    if not os.path.isfile(pdf_path):
        print(f"ERROR: File not found: {pdf_path}")
        sys.exit(1)

    if not os.path.isdir(output_dir):
        os.makedirs(output_dir, exist_ok=True)

    try:
        doc = pymupdf.open(pdf_path)
    except Exception as e:
        print(f"ERROR: Could not open PDF: {e}")
        sys.exit(1)

    # Limit to first 3 pages to prevent hanging on massive documents
    pages_to_scan = min(len(doc), 3)
    generated_images = []

    for page_num in range(pages_to_scan):
        page = doc[page_num]
        
        # 300 DPI for good OCR quality (4.16 zoom)
        zoom_matrix = pymupdf.Matrix(4.0, 4.0)
        pixmap = page.get_pixmap(matrix=zoom_matrix, alpha=False)
        
        image_path = os.path.join(output_dir, f"page_{page_num + 1}.png")
        pixmap.save(image_path)
        generated_images.append(image_path)

    doc.close()

    # Output just the image paths, one per line, so Node can read them
    for img in generated_images:
        print(img)

if __name__ == "__main__":
    main()
