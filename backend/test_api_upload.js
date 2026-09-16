const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

async function testUpload() {
    try {
        const form = new FormData();
        form.append('agencyId', '1');
        // use any small pdf
        form.append('file', fs.createReadStream('C:\\Users\\Admin\\Downloads\\k-owl\\backend\\uploads\\1789539970623-dummy.pdf'), 'dummy_upload_test.pdf');

        console.log('Uploading file...');
        const res = await axios.post('http://localhost:3000/api/documents/upload', form, {
            headers: {
                ...form.getHeaders(),
                // Mock user ID 1 or a valid token if auth is required?
                // The API requires auth!
                // We need to bypass auth or get a token.
            }
        });
        console.log(res.data);
    } catch (err) {
        console.error('UPLOAD ERROR:', err.response ? err.response.data : err.message);
    }
}
testUpload();
