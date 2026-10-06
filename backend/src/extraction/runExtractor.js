const { execFile } = require('child_process');
const path = require('path');

class ExtractionError extends Error {
    constructor(message, stderr) {
        super(message);
        this.name = 'ExtractionError';
        this.stderr = stderr;
    }
}

/**
 * Spawns extract.py and returns the parsed JSON.
 */
const runExtractor = async (filePath) => {
    return new Promise((resolve, reject) => {
        const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
        const scriptPath = path.join(__dirname, '../../scripts/extract.py');

        // Estimate timeout based on file size. Base 2 mins + 1 min per MB. Max 10 mins.
        const fs = require('fs');
        const stats = fs.statSync(filePath);
        const sizeMb = stats.size / (1024 * 1024);
        const timeoutMs = Math.round(Math.min(10 * 60 * 1000, 2 * 60 * 1000 + (sizeMb * 60 * 1000)));

        execFile(pythonCmd, [scriptPath, filePath], {
            timeout: timeoutMs,
            maxBuffer: 50 * 1024 * 1024, // 50MB stdout buffer for huge documents
            env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
        }, (error, stdout, stderr) => {
            if (error) {
                return reject(new ExtractionError(`Python script failed (code ${error.code}): ${error.message}`, stderr));
            }

            try {
                // Find where the JSON actually starts to avoid printed PyTorch warnings
                const jsonStart = stdout.indexOf('{');
                if (jsonStart === -1) throw new Error("No JSON found in stdout");
                
                const cleanJson = stdout.substring(jsonStart);
                const result = JSON.parse(cleanJson);
                
                if (!result.ok) {
                    throw new Error("Python script returned ok: false");
                }
                
                resolve(result);
            } catch (parseError) {
                reject(new ExtractionError(`Failed to parse Python output: ${parseError.message}`, stderr + "\n\nSTDOUT:\n" + stdout));
            }
        });
    });
};

module.exports = {
    runExtractor,
    ExtractionError
};
