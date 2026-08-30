import multer from "multer";
import path from "path";
import fs from "fs";

/* =========================================================
   AVATAR DIRECTORY
========================================================= */

const avatarDirectory = path.resolve("avatars");

if (!fs.existsSync(avatarDirectory)) {
  fs.mkdirSync(avatarDirectory, {
    recursive: true,
  });
}

/* =========================================================
   STORAGE
========================================================= */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);

    const filename = `avatar-${req.user.id}-${Date.now()}${extension}`;

    cb(null, filename);
  },
});

/* =========================================================
   FILE FILTER
========================================================= */

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, PNG and WEBP images are allowed."), false);
  }
};

/* =========================================================
   MULTER
========================================================= */

const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export default uploadAvatar;
