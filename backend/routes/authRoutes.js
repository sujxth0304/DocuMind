import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";

const router = express.Router();

// POST /api/auth/login
router.post("/login", loginUser);

// POST /api/auth/register
router.post("/register", registerUser);

export default router;

