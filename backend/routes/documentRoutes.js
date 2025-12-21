import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { uploadDocument } from "../controllers/documentController.js";

const router = express.Router();

// POST /api/documents/upload
router.post(
  "/upload",
  protect,
  upload.single("document"),
  uploadDocument
);

export default router;
