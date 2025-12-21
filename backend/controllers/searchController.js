import Document from "../models/Document.js";

export const searchDocuments = async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ message: "Query is required" });
  }

  const docs = await Document.find({
    user: req.user._id,
    chunks: { $regex: query, $options: "i" },
  });

  res.json({
    results: docs.map(doc => ({
      documentId: doc._id,
      name: doc.originalName,
    })),
  });
};
