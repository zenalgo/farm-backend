const mongoose = require("mongoose");

const feedCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true, lowercase: true },
    icon: { type: String, default: "📦" },
    description: { type: String, default: "" },
    itemType: {
      type: String,
      enum: ["feed", "raw_material", "filler", "supplement", "fodder", "general"],
      default: "general",
    },
    targetAnimal: {
      type: String,
      enum: ["poultry", "cattle", "goat", "general", "all"],
      default: "general",
    },
    isDefault: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FeedCategory", feedCategorySchema);
