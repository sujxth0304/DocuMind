import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { answerQuestion } from "../controllers/qaController.js";

const router = express.Router();

// POST /api/qa/ask
router.post("/ask", protect, answerQuestion);

export default router;
