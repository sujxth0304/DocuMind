import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { searchDocuments } from "../controllers/searchController.js";

const router = express.Router();

router.get("/", protect, searchDocuments);

export default router;
