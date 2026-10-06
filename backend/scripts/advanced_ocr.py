import sys
import easyocr

def main():
    if len(sys.argv) < 2:
        print("Usage: python advanced_ocr.py <image_path>")
        sys.exit(1)
        
    image_path = sys.argv[1]
    
    try:
        # Load EasyOCR reader (disable GPU for compatibility across environments)
        reader = easyocr.Reader(['en'], gpu=False, verbose=False)
        
        # Read text with paragraph=True to group related lines (preserves columns better)
        results = reader.readtext(image_path, paragraph=True)
        
        # results format: [([[x1,y1], [x2,y1], [x2,y2], [x1,y2]], 'text'), ...]
        
        # Sort paragraphs by X coordinate first (to group columns), then Y coordinate
        # Wait, if we sort by X first, we read all of column 1 top-to-bottom, then column 2.
        # But we must group them into distinct columns.
        
        columns = []
        for bbox, text in results:
            x_min = min([point[0] for point in bbox])
            y_min = min([point[1] for point in bbox])
            
            # Find a matching column (within 100 pixels horizontally)
            found_col = False
            for col in columns:
                if abs(col['x_avg'] - x_min) < 200: # generous margin for column alignment
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
        
        # Print text column by column
        full_text = ""
        for col_idx, col in enumerate(columns):
            # Sort blocks within the column top-to-bottom
            col['blocks'].sort(key=lambda b: b['y'])
            for block in col['blocks']:
                full_text += block['text'] + "\n\n"
                
        print(full_text.strip())
        
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == '__main__':
    main()
