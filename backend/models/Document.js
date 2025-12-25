import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    content: {
        type: String,
    },
    chunks: [
    {
        text: String,
        embedding: [Number],
    },
],


  },
  { timestamps: true }
);

export default mongoose.model("Document", documentSchema);


