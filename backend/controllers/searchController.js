import Document from "../models/Document.js";
import { getEmbedding } from "../utils/embedding.js";
import { cosineSimilarity } from "../utils/similarity.js";

export const semanticSearch = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: "Query required" });
    }

    const queryEmbedding = await getEmbedding(query);
    const docs = await Document.find({ user: req.user._id });

    const results = [];

    docs.forEach(doc => {
      doc.chunks.forEach(chunk => {
        const score = cosineSimilarity(queryEmbedding, chunk.embedding);
        results.push({
          document: doc.originalName,
          text: chunk.text,
          score,
        });
      });
    });

    results.sort((a, b) => b.score - a.score);

    res.json(results.slice(0, 5));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
