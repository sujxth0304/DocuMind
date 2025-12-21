import Document from "../models/Document.js";
import { extractText } from "../utils/textExtractor.js";

export const uploadDocument = async (req, res) => {
  try {
    console.log("FILE INFO:", req.file); // 👈 ADD THIS

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    console.log("Starting text extraction..."); // 👈 ADD

    const extractedText = await extractText(
      req.file.path,
      req.file.mimetype
    );

    console.log("Text extracted, length:", extractedText.length); // 👈 ADD

    const doc = await Document.create({
      user: req.user._id,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileType: req.file.mimetype,
      content: extractedText,
    });

    res.status(201).json({
      message: "Document uploaded & processed",
      documentId: doc._id,
      textLength: extractedText.length,
    });
  } catch (error) {
    console.error("UPLOAD ERROR:", error); // 👈 VERY IMPORTANT
    res.status(500).json({ message: "Server error" });
  }
};
