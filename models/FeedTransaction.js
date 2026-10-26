const mongoose = require("mongoose");

const feedTransactionSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, default: Date.now },
    type: { type: String, enum: ["CREDIT", "DEBIT"], required: true }, // CREDIT (Inward/Purchase/Mix), DEBIT (Consumption/Loss)
    silo: { type: mongoose.Schema.Types.ObjectId, ref: "FeedSilo", required: true },
    feedType: { type: String, required: true }, // snapshot of Silo or feed name (e.g. "Pre-Starter", "Own Feed")
    quantity: { type: Number, required: true, min: 0.1 }, // always positive in storage
    unit: { type: String, default: "kg" },
    unitPrice: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    source: {
      type: String,
      enum: ["manual", "poultry", "brooder", "animal", "mixing", "purchase", "task", "spoilage", "auto_schedule"],
      default: "manual",
    },
    // Integration references
    relatedPoultryBatch: { type: mongoose.Schema.Types.ObjectId, ref: "PoultryBatch", default: null },
    relatedPoultryBrooder: { type: mongoose.Schema.Types.ObjectId, ref: "PoultryBrooder", default: null },
    relatedAnimal: { type: mongoose.Schema.Types.ObjectId, ref: "Animal", default: null },
    relatedWorkTask: { type: mongoose.Schema.Types.ObjectId, ref: "WorkTask", default: null },
    mixingBatchId: { type: String, default: null }, // groups transactions from the same mixing operation
    vendor: { type: String, default: "" },
    description: { type: String, default: "" },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FeedTransaction", feedTransactionSchema);
