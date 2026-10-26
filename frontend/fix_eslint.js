const fs = require('fs');
let code = fs.readFileSync('src/pages/ManageDocuments.jsx', 'utf8');

// Move fetchData above useEffect
const fetchStart = code.indexOf('const fetchData = async () => {');
const fetchEnd = code.indexOf('    };', fetchStart) + 6;
const fetchBlock = code.substring(fetchStart, fetchEnd);
code = code.substring(0, fetchStart) + code.substring(fetchEnd);

const effectStart = code.indexOf('useEffect(() => {\n        fetchData();');
code = code.substring(0, effectStart) + fetchBlock + '\n\n    ' + code.substring(effectStart);

// Fix state mutation
code = code.replace('fullMetadata["Document Info"] = dataToSave;', 'const newMetadata = { ...fullMetadata, "Document Info": dataToSave };');
code = code.replace('dynamicMetadata: fullMetadata', 'dynamicMetadata: newMetadata');

fs.writeFileSync('src/pages/ManageDocuments.jsx', code);
console.log("Fixed ESLint errors");
