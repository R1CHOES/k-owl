import sys

with open('scripts/extract.py', 'r', encoding='utf-8') as f:
    code = f.read()

replacement1 = """table_rects = []
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
                
            raw_blocks = page.get_text("dict", sort=True).get("blocks", [])"""

code = code.replace('raw_blocks = page.get_text("dict", sort=True).get("blocks", [])', replacement1)

replacement2 = """if b.get("type") == 0: # text block
                    # Skip if text is inside a table
                    b_rect = b["bbox"]
                    is_in_table = False
                    for t_rect in table_rects:
                        if not (b_rect[2] <= t_rect[0] or b_rect[0] >= t_rect[2] or b_rect[3] <= t_rect[1] or b_rect[1] >= t_rect[3]):
                            is_in_table = True
                            break
                    if is_in_table: continue"""

code = code.replace('if b.get("type") == 0: # text block', replacement2)

with open('scripts/extract.py', 'w', encoding='utf-8') as f:
    f.write(code)
