import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    tags: { type: [String], default: [] },             // e.g., ["react", "system-design"]
    role: { type: String, trim: true },                 // target role (optional)
    level: { type: String, trim: true },                // e.g., "junior" | "mid" | "senior"
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
      index: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isCurated: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
    minimize: false,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

// Helpful indexes for search/filter
QuestionSchema.index({ role: 1, level: 1, difficulty: 1 });
QuestionSchema.index({ tags: 1 });

export default mongoose.models.Question || mongoose.model("Question", QuestionSchema);
