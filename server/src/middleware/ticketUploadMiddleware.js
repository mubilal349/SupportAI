import multer from "multer";
import path from "path";
import fs from "fs";

// ==========================================
// TICKET UPLOAD DIRECTORY
// ==========================================

const uploadDir = path.join(process.cwd(), "uploads", "tickets");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

// ==========================================
// STORAGE
// ==========================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const safeName = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .substring(0, 50);

    const uniqueName = `ticket-${req.params.id}-${Date.now()}-${safeName}${extension}`;

    cb(null, uniqueName);
  },
});

// ==========================================
// ALLOWED FILE TYPES
// ==========================================

const allowedTypes = [
  // Images
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",

  // PDF
  "application/pdf",

  // Text
  "text/plain",
  "text/csv",

  // Microsoft Word
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  // Microsoft Excel
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

// ==========================================
// FILE FILTER
// ==========================================

const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Unsupported file type. Allowed files: JPG, JPEG, PNG, WEBP, GIF, PDF, TXT, CSV, DOC, DOCX, XLS, and XLSX.",
      ),
      false,
    );
  }
};

// ==========================================
// MULTER
// ==========================================

const uploadTicket = multer({
  storage,

  fileFilter,

  limits: {
    // Maximum size of each file = 10 MB
    fileSize: 10 * 1024 * 1024,

    // Maximum number of files
    files: 5,
  },
});

export default uploadTicket;
