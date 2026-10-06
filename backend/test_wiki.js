const https = require('https');
const checkUrl = (url) => {
    return new Promise((resolve) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            resolve({ url, status: res.statusCode });
        }).on('error', () => resolve({ url, status: 'ERROR' }));
    });
};
const urls = [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Philippine_Atmospheric%2C_Geophysical_and_Astronomical_Services_Administration_%2C_PAGASA_Logo.png/240px-Philippine_Atmospheric%2C_Geophysical_and_Astronomical_Services_Administration_%2C_PAGASA_Logo.png',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/PHIVOLCS_logo.svg/240px-PHIVOLCS_logo.svg.png',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/DOST-FNRI_Logo.png/240px-DOST-FNRI_Logo.png',
    'https://upload.wikimedia.org/wikipedia/en/thumb/d/db/Philippine_Science_High_School_System_logo.svg/240px-Philippine_Science_High_School_System_logo.svg.png',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/DOST_-_PCIEERD_Official_Logo.png/240px-DOST_-_PCIEERD_Official_Logo.png',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/PCAARRD_Logo.png/240px-PCAARRD_Logo.png',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Philippine_Nuclear_Research_Institute_%28PNRI%29_logo.svg/240px-Philippine_Nuclear_Research_Institute_%28PNRI%29_logo.svg.png',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/National_Academy_of_Science_and_Technology_%28NAST%29_logo.svg/240px-National_Academy_of_Science_and_Technology_%28NAST%29_logo.svg.png'
];
Promise.all(urls.map(checkUrl)).then(console.log);
