import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    name: { type: String, trim: true },
    role: { type: String, trim: true },          // e.g., "Frontend Engineer"
    yearsExp: { type: Number, min: 0, default: 0 },
    skills: { type: [String], default: [] },      // e.g., ["react", "js", "css"]
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

// Avoid model overwrite in dev
export default mongoose.models.User || mongoose.model("User", UserSchema);
