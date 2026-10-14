const mongoose = require("mongoose");

const feedSiloSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "Pre-Starter", "Starter", "Grower", "Finisher", "Own Feed", "Cattle Feed"
    code: { type: String, required: true, trim: true, lowercase: true }, // e.g. "pre_starter", "starter", "grower", "finisher"
    capacityKg: { type: Number, required: true, default: 10000, min: 100 },
    currentStockKg: { type: Number, required: true, default: 0, min: 0 },
    reorderLevelKg: { type: Number, default: 2000, min: 0 },
    unit: { type: String, default: "kg" },
    category: {
      type: String,
      enum: ["poultry", "cattle", "goat", "general", "raw_material"],
      default: "poultry",
    },
    costPerKg: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "archived"], default: "active" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

feedSiloSchema.virtual("fillPercent").get(function () {
  if (!this.capacityKg || this.capacityKg <= 0) return 0;
  return Math.min(100, Math.round((this.currentStockKg / this.capacityKg) * 100));
});

feedSiloSchema.virtual("isLowStock").get(function () {
  return this.currentStockKg <= this.reorderLevelKg;
});

feedSiloSchema.set("toObject", { virtuals: true });
feedSiloSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("FeedSilo", feedSiloSchema);
