import sys
import easyocr
import pymupdf
import warnings

warnings.filterwarnings("ignore")

def extract_pdf_layout(pdf_path):
    # Initialize EasyOCR reader on CPU (fast enough for background jobs)
    reader = easyocr.Reader(['en'], gpu=False, verbose=False)
    
    doc = pymupdf.open(pdf_path)
    full_text = ""
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        
        # Render page to a high-res image (2.0 zoom is a good balance for EasyOCR)
        zoom_matrix = pymupdf.Matrix(2.0, 2.0)
        pixmap = page.get_pixmap(matrix=zoom_matrix, alpha=False)
        
        # Convert pixmap to image format easyocr can read (numpy array)
        import numpy as np
        img_data = np.frombuffer(pixmap.samples, dtype=np.uint8).reshape(pixmap.h, pixmap.w, pixmap.n)
        
        if pixmap.n == 4:
            import cv2
            img_data = cv2.cvtColor(img_data, cv2.COLOR_RGBA2RGB)
            
        # Run EasyOCR with paragraph=True to get distinct text blocks
        results = reader.readtext(img_data, paragraph=True)
        
        # Group into columns
        columns = []
        for bbox, text in results:
            x_min = min([point[0] for point in bbox])
            y_min = min([point[1] for point in bbox])
            
            # Find a matching column (within 200 scaled pixels horizontally)
            found_col = False
            for col in columns:
                if abs(col['x_avg'] - x_min) < 300: # generously wide column margin
                    col['blocks'].append({'y': y_min, 'text': text})
                    # update average x
                    col['x_avg'] = (col['x_avg'] * (len(col['blocks'])-1) + x_min) / len(col['blocks'])
                    found_col = True
                    break
            
            if not found_col:
                columns.append({
                    'x_avg': x_min,
                    'blocks': [{'y': y_min, 'text': text}]
                })
                
        # Sort columns left-to-right
        columns.sort(key=lambda col: col['x_avg'])
        
        # Append text column by column
        full_text += f"\n\n--- PAGE {page_num + 1} ---\n\n"
        for col_idx, col in enumerate(columns):
            # Sort blocks within the column top-to-bottom
            col['blocks'].sort(key=lambda b: b['y'])
            for block in col['blocks']:
                full_text += block['text'] + "\n\n"
                
    return full_text.strip()

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python pdf_to_text.py <pdf_path>")
        sys.exit(1)
        
    pdf_path = sys.argv[1]
    
    try:
        text = extract_pdf_layout(pdf_path)
        # Ensure utf-8 printing for Windows
        sys.stdout.reconfigure(encoding='utf-8')
        print(text)
    except Exception as e:
        print(f"ERROR: {e}")
