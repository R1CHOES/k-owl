import sys

def patch_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        code = f.read()

    # Find the span classes
    old_class_base = "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
    new_class_base = "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block whitespace-nowrap"
    
    code = code.replace(old_class_base, new_class_base)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(code)

patch_file("src/pages/ManageDocuments.jsx")
patch_file("src/pages/QAApprovals.jsx")
print("Fixed status badges")
