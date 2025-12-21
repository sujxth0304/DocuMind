import multer from "multer";
import path from "path";

// Storage config
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/documents");
  },
  filename(req, file, cb) {
    cb(
      null,
      `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`
    );
  },
});

// File filter (PDF / DOCX only)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF and DOCX files are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter,
});

export default upload;
