import mongoose from "mongoose";

const TranscriptSchema = new mongoose.Schema(
  {
    speaker: { type: String, enum: ["user", "ai"], required: true },
    text: { type: String, default: "" },
    ts: { type: Date, default: Date.now },
  },
  { _id: false }
);

const SessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },

    role: { type: String, default: "Software Engineer" },
    company: { type: String, default: "Company" },
    jdText: { type: String, default: "" },
    resumeText: { type: String, default: "" },

    settings: {
      persona: { type: String, default: "tough-but-fair" },
      difficulty: { type: String, default: "normal" },
      timeboxSec: { type: Number, default: 90 },
      mode: { type: String, default: "pending" }, // pending | technical | general | combo
      voice: {
        mode: { type: String, default: "vapi" },
        pace: { type: String, default: "normal" },
      },
    },

    notes: { type: String, default: "" },
    notesUpdatedAt: { type: Date, default: null },

    // JSON-friendly fields
    scores: { type: mongoose.Schema.Types.Mixed, default: null },
    feedback: { type: mongoose.Schema.Types.Mixed, default: null },

    transcript: { type: [TranscriptSchema], default: [] },
    transcriptCount: { type: Number, default: 0 },

    archived: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },

    activity: {
      type: [
        {
          action: String,
          at: { type: Date, default: Date.now },
          meta: mongoose.Schema.Types.Mixed,
        },
      ],
      default: [],
    },

    share: {
      enabled: { type: Boolean, default: false },
      token: { type: String, index: true, sparse: true },
      includeNotes: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// --- IMPORTANT for Next.js dev/hot reload: force recompile the model ---
if (mongoose.models.Session) {
  try {
    mongoose.deleteModel("Session");
  } catch (_) {
    // ignore in case it's already deleted between reloads
  }
}

export default mongoose.model("Session", SessionSchema);
