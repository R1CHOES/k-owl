const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists at backend/uploads
const uploadDir = path.join(__dirname, '../../../backend/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Use Date.now() + original name to ensure uniqueness on disk
        // Replace spaces with underscores to avoid whitespace issues in URLs
        const sanitizedName = file.originalname.replace(/\s+/g, '_');
        cb(null, Date.now() + '-' + sanitizedName);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/pdf'
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, DOC, and DOCX are allowed.'), false);
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

module.exports = upload;
