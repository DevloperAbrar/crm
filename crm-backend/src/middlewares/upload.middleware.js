const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Section 6: "File Storage: Local disk or S3-compatible bucket. Attachments:
// visiting cards, pricing PDFs, images." This implements the local-disk
// option - swap the storage engine for an S3 client later without touching
// any controller code, since callers only ever see `fileUrl`.
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 }, // 10MB per file, 5 files max
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: images and PDF.`));
    }
    cb(null, true);
  },
});

module.exports = { upload, UPLOAD_DIR };
