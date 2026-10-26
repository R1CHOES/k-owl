import sys

with open("src/pages/QAApprovals.jsx", "r", encoding="utf-8") as f:
    code = f.read()

# Replace any tracking-wider"> with tracking-wider whitespace-nowrap"> in the getStatusBadge switch block
start_idx = code.find("const getStatusBadge")
end_idx = code.find("};", start_idx)

if start_idx != -1 and end_idx != -1:
    block = code[start_idx:end_idx]
    new_block = block.replace('tracking-wider">', 'tracking-wider whitespace-nowrap">')
    code = code[:start_idx] + new_block + code[end_idx:]

with open("src/pages/QAApprovals.jsx", "w", encoding="utf-8") as f:
    f.write(code)

print("Patched QAApprovals getStatusBadge")
