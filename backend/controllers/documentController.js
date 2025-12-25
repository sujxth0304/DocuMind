import Document from "../models/Document.js";
import { extractText } from "../utils/textExtractor.js";
import { chunkText } from "../utils/textChunker.js";
import { getEmbedding } from "../utils/embedding.js";

export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    console.log("FILE INFO:", req.file);
    console.log("Starting text extraction...");

    // 1️⃣ Extract text
    const extractedText = await extractText(
      req.file.path,
      req.file.mimetype
    );

    console.log("Text extraction completed.");

    // 2️⃣ Chunk text
    const rawChunks = chunkText(extractedText);

    // 3️⃣ Create document FIRST (no embeddings yet)
    const doc = await Document.create({
      user: req.user._id,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileType: req.file.mimetype,
      content: extractedText,
      chunks: rawChunks.map(text => ({ text })),
    });

    // ✅ 4️⃣ RESPOND IMMEDIATELY (Postman will stop hanging)
    res.status(201).json({
      message: "Document uploaded. Embeddings processing in background.",
      documentId: doc._id,
      chunks: rawChunks.length,
    });

    // 🔥 5️⃣ BACKGROUND EMBEDDING PROCESS
    setImmediate(async () => {
      try {
        console.log("Starting background embedding...");

        const embeddedChunks = [];

        for (const chunk of rawChunks) {
          const embedding = await getEmbedding(chunk);
          embeddedChunks.push({
            text: chunk,
            embedding,
          });
        }

        doc.chunks = embeddedChunks;
        await doc.save();

        console.log("Embeddings completed for document:", doc._id);
      } catch (err) {
        console.error("Embedding background error:", err);
      }
    });

  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};
