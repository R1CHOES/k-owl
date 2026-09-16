const { extractAndOrganize } = require('./src/services/contentExtractionService');

(async () => {
    try {
        console.log('Testing extraction on version 2...');
        await extractAndOrganize(2);
        console.log('Done.');
    } catch (err) {
        console.error('TEST ERROR:', err);
    }
})();
