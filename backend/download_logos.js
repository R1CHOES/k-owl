const fs = require('fs');
const path = require('path');
const https = require('https');

const agencies = [
  { name: "DOST-PAGASA", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Philippine_Atmospheric%2C_Geophysical_and_Astronomical_Services_Administration_%2C_PAGASA_Logo.png/600px-Philippine_Atmospheric%2C_Geophysical_and_Astronomical_Services_Administration_%2C_PAGASA_Logo.png" },
  { name: "DOST-PHIVOLCS", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/PHIVOLCS_logo.svg/600px-PHIVOLCS_logo.svg.png" },
  { name: "DOST-SEI", url: "https://sei.dost.gov.ph/wp-content/uploads/2023/10/sei-logo-300x300.png" },
  { name: "DOST-PSHS", url: "https://upload.wikimedia.org/wikipedia/en/thumb/d/db/Philippine_Science_High_School_System_logo.svg/600px-Philippine_Science_High_School_System_logo.svg.png" },
  { name: "DOST-STII", url: "https://stii.dost.gov.ph/images/stii-logo.png" },
  { name: "DOST-TAPI", url: "https://www.tapi.dost.gov.ph/images/tapi-logo-transparent.png" },
  { name: "DOST-PCIEERD", url: "https://pcieerd.dost.gov.ph/images/transparen-logo.png" },
  { name: "DOST-PCHRD", url: "https://www.pchrd.dost.gov.ph/wp-content/uploads/2021/04/PCHRD-logo-2021-300x300.png" },
  { name: "DOST-PCAARRD", url: "https://www.pcaarrd.dost.gov.ph/images/logo/PCAARRD-logo.png" },
  { name: "DOST-ASTI", url: "https://asti.dost.gov.ph/wp-content/uploads/2018/06/asti-logo.png" },
  { name: "DOST-FNRI", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/DOST-FNRI_Logo.png/600px-DOST-FNRI_Logo.png" },
  { name: "DOST-FPRDI", url: "https://fprdi.dost.gov.ph/images/DOST-FPRDI-logo.png" },
  { name: "DOST-ITDI", url: "https://itdi.dost.gov.ph/images/ITDILogo_transparent.png" },
  { name: "DOST-MIRDC", url: "https://mirdc.dost.gov.ph/images/MIRDC_Logo.png" },
  { name: "DOST-PNRI", url: "https://pnri.dost.gov.ph/images/PNRI-logo.png" },
  { name: "DOST-PTRI", url: "https://ptri.dost.gov.ph/images/logo/ptri-logo.png" },
  { name: "DOST-NAST", url: "https://nast.dost.gov.ph/images/NAST_Logo.png" },
  { name: "DOST-NRCP", url: "https://nrcp.dost.gov.ph/wp-content/uploads/2021/08/nrcp-logo-1.png" }
];

async function download(url, dest) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
            }
        }, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                download(res.headers.location, dest).then(resolve).catch(reject);
                return;
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`Status ${res.statusCode}`));
            }
            const file = fs.createWriteStream(dest);
            res.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        });
        req.on('error', reject);
    });
}

async function run() {
    const dir = path.join(__dirname, '..', 'frontend', 'public', 'logos');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    for (const a of agencies) {
        try {
            await download(a.url, path.join(dir, `${a.name}.png`));
            console.log(`✅ ${a.name}`);
        } catch (e) {
            console.log(`❌ ${a.name}: ${e.message}`);
        }
    }
}
run();
