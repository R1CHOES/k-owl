import sys
import os
import json
import traceback
import warnings

# Suppress PyTorch/EasyOCR warnings so they don't corrupt stdout
warnings.filterwarnings("ignore")

def eprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)

def process_pdf(file_path):
    import pymupdf
    import easyocr
    import numpy as np
    import cv2
    
    doc = pymupdf.open(file_path)
    pages_data = []
    
    reader = None # lazy init
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        
        # Determine if we should OCR
        text_len = len(page.get_text("text").strip())
        
        # Look at image area
        image_area = 0
        page_area = page.rect.width * page.rect.height
        for img in page.get_images(full=True):
            rect = page.get_image_bbox(img)
            image_area += rect.width * rect.height
            
        is_scanned = text_len < 200 or (image_area / page_area) > 0.4
        
        blocks = []
        method = "text"
        
        if is_scanned:
            method = "ocr"
            if reader is None:
                reader = easyocr.Reader(['en'], gpu=False, verbose=False)
                
            zoom = 2.0
            matrix = pymupdf.Matrix(zoom, zoom)
            pixmap = page.get_pixmap(matrix=matrix, alpha=False)
            
            img_data = np.frombuffer(pixmap.samples, dtype=np.uint8).reshape(pixmap.h, pixmap.w, pixmap.n)
            if pixmap.n == 4:
                img_data = cv2.cvtColor(img_data, cv2.COLOR_RGBA2RGB)
                
            # paragraph=True groups things well, but we need blocks for the JS sectioner
            results = reader.readtext(img_data, paragraph=True)
            
            for bbox, text in results:
                x0 = min([p[0] for p in bbox]) / zoom
                y0 = min([p[1] for p in bbox]) / zoom
                x1 = max([p[0] for p in bbox]) / zoom
                y1 = max([p[1] for p in bbox]) / zoom
                
                blocks.append({
                    "text": text,
                    "x0": x0, "y0": y0, "x1": x1, "y1": y1,
                    "size": (y1 - y0) * 0.8, # approximation
                    "bold": False
                })
        else:
            # Standard PDF text extraction
            table_rects = []
            try:
                tabs = page.find_tables()
                if tabs.tables:
                    for t in tabs.tables:
                        table_rects.append(t.bbox)
                        md = t.to_markdown()
                        blocks.append({
                            "text": md,
                            "x0": t.bbox[0], "y0": t.bbox[1],
                            "x1": t.bbox[2], "y1": t.bbox[3],
                            "size": 11,
                            "bold": False,
                            "is_table": True
                        })
            except Exception as e:
                pass
                
            raw_blocks = page.get_text("dict", sort=True).get("blocks", [])
            for b in raw_blocks:
                if b.get("type") == 0: # text block
                    # Skip if text is inside a table
                    b_rect = b["bbox"]
                    is_in_table = False
                    for t_rect in table_rects:
                        if not (b_rect[2] <= t_rect[0] or b_rect[0] >= t_rect[2] or b_rect[3] <= t_rect[1] or b_rect[1] >= t_rect[3]):
                            is_in_table = True
                            break
                    if is_in_table: continue
                    full_text = ""
                    max_size = 0
                    is_bold = False
                    
                    for line in b.get("lines", []):
                        for span in line.get("spans", []):
                            full_text += span.get("text", "") + " "
                            if span.get("size", 0) > max_size:
                                max_size = span.get("size")
                            if "bold" in span.get("font", "").lower() or "black" in span.get("font", "").lower():
                                is_bold = True
                    
                    full_text = full_text.strip()
                    if full_text:
                        blocks.append({
                            "text": full_text,
                            "x0": b["bbox"][0], "y0": b["bbox"][1], 
                            "x1": b["bbox"][2], "y1": b["bbox"][3],
                            "size": max_size,
                            "bold": is_bold
                        })
                        
        pages_data.append({
            "page": page_num + 1,
            "method": method,
            "blocks": blocks
        })
        
    return {"ok": True, "pages": pages_data}

def process_docx(file_path):
    import docx
    doc = docx.Document(file_path)
    pages_data = []
    blocks = []
    
    # We treat the whole DOCX as one continuous "page"
    y_approx = 0
    
    for para in doc.paragraphs:
        text = para.text.strip()
        if not text: continue
        
        style = para.style.name.lower()
        is_heading = "heading" in style
        is_bold = is_heading or any(run.bold for run in para.runs)
        
        size = 12
        if is_heading:
            size = 16
        
        blocks.append({
            "text": text,
            "x0": 0, "y0": y_approx, "x1": 500, "y1": y_approx + 20,
            "size": size,
            "bold": is_bold
        })
        y_approx += 25
        
    for table in doc.tables:
        for row in table.rows:
            row_data = [cell.text.strip() for cell in row.cells if cell.text.strip()]
            if row_data:
                blocks.append({
                    "text": " | ".join(row_data),
                    "x0": 0, "y0": y_approx, "x1": 500, "y1": y_approx + 20,
                    "size": 10,
                    "bold": False
                })
                y_approx += 25
                
    pages_data.append({
        "page": 1,
        "method": "docx",
        "blocks": blocks
    })
    
    return {"ok": True, "pages": pages_data}

def main():
    if len(sys.argv) < 2:
        eprint("Usage: python extract.py <file_path>")
        sys.exit(1)
        
    file_path = sys.argv[1]
    ext = os.path.splitext(file_path)[1].lower()
    
    try:
        if ext == '.pdf':
            result = process_pdf(file_path)
        elif ext in ['.docx', '.doc']:
            result = process_docx(file_path)
        else:
            raise ValueError(f"Unsupported file extension: {ext}")
            
        print(json.dumps(result))
    except Exception as e:
        eprint(f"Extraction failed: {e}")
        eprint(traceback.format_exc())
        sys.exit(1)

if __name__ == '__main__':
    main()
