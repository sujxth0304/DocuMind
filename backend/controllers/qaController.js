import Document from "../models/Document.js";
import { getEmbedding } from "../utils/embedding.js";
import { cosineSimilarity } from "../utils/similarity.js";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

export const answerQuestion = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ message: "Question is required" });
    }

    // 1️⃣ Embed the question
    const questionEmbedding = await getEmbedding(question);

    // 2️⃣ Fetch user documents
    const docs = await Document.find({ user: req.user._id });

    const scoredChunks = [];

    docs.forEach(doc => {
      doc.chunks.forEach(chunk => {
        if (!chunk.embedding) return;

        const score = cosineSimilarity(
          questionEmbedding,
          chunk.embedding
        );

        scoredChunks.push({
          document: doc.originalName,
          text: chunk.text,
          score,
        });
      });
    });

    // 3️⃣ Pick top relevant chunks
    scoredChunks.sort((a, b) => b.score - a.score);
    const topChunks = scoredChunks.slice(0, 5);

    if (topChunks.length === 0) {
      return res.json({
        answer: "I could not find relevant information in your documents.",
      });
    }

    // 4️⃣ Build grounded prompt
    const context = topChunks
      .map(
        (c, i) =>
          `Source ${i + 1} (${c.document}):\n${c.text}`
      )
      .join("\n\n");

    const prompt = `
You are an assistant answering strictly from the provided sources.
If the answer is not present, say:
"I could not find this information in the uploaded documents."

SOURCES:
${context}

QUESTION:
${question}

ANSWER (1-2 concise sentences): 
`;

    // 5️⃣ Call Gemini REST API (STABLE)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini REST error:", data);
      return res.status(500).json({
        message: "Gemini Q&A failed",
      });
    }

    const answer =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No answer generated.";

    res.json({
  answer,
  sources: topChunks.map(c => ({
    document: c.document,
    score: c.score.toFixed(3),
    excerpt: c.text.slice(0, 200) + "..."
  })),
});


  } catch (error) {
    console.error("Q&A ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};
