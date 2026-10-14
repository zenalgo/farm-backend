const FeedSilo = require("../models/FeedSilo");
const FeedTransaction = require("../models/FeedTransaction");
const Animal = require("../models/Animal");
const PoultryBatch = require("../models/PoultryBatch");
const PoultryBrooder = require("../models/PoultryBrooder");

const startOfDay = (d = new Date()) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (d = new Date()) => {
  const date = new Date(d);
  date.setHours(23, 59, 59, 999);
  return date;
};

// Default seed silos to mirror screenshot and farm standards
const DEFAULT_SILOS = [
  { name: "Pre-Starter", code: "pre_starter", capacityKg: 10000, currentStockKg: 1200, reorderLevelKg: 2000, category: "poultry" },
  { name: "Starter", code: "starter", capacityKg: 10000, currentStockKg: 5600, reorderLevelKg: 2000, category: "poultry" },
  { name: "Grower", code: "grower", capacityKg: 10000, currentStockKg: 6700, reorderLevelKg: 2000, category: "poultry" },
  { name: "Finisher", code: "finisher", capacityKg: 10000, currentStockKg: 3200, reorderLevelKg: 2000, category: "poultry" },
  { name: "Own Feed", code: "own_feed", capacityKg: 10000, currentStockKg: 4200, reorderLevelKg: 1500, category: "general" },
  { name: "Cattle Feed", code: "cattle_feed", capacityKg: 10000, currentStockKg: 4500, reorderLevelKg: 2000, category: "cattle" },
  { name: "Goat Feed", code: "goat_feed", capacityKg: 5000, currentStockKg: 2800, reorderLevelKg: 1000, category: "goat" },
];

// Helper to seed silos if none exist
const ensureDefaultSilos = async (userId) => {
  const count = await FeedSilo.countDocuments();
  if (count === 0) {
    for (const item of DEFAULT_SILOS) {
      await FeedSilo.create({ ...item, createdBy: userId || null });
    }
  }
};

// @desc    Get all feed silos with capacity and fill %
// @route   GET /api/feed/silos
// @access  Private
exports.getFeedSilos = async (req, res) => {
  try {
    await ensureDefaultSilos(req.user?._id);

    const silos = await FeedSilo.find({ status: "active" }).sort({ createdAt: 1 });

    const totalStockKg = silos.reduce((sum, s) => sum + (s.currentStockKg || 0), 0);
    const totalCapacityKg = silos.reduce((sum, s) => sum + (s.capacityKg || 0), 0);
    const lowStockCount = silos.filter((s) => s.currentStockKg <= s.reorderLevelKg).length;

    res.status(200).json({
      success: true,
      count: silos.length,
      totalStockKg,
      totalCapacityKg,
      lowStockCount,
      silos,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch feed silos", error: error.message });
  }
};

// @desc    Create a new feed silo
// @route   POST /api/feed/silos
// @access  Private (Admin / Manager)
exports.createFeedSilo = async (req, res) => {
  try {
    const { name, capacityKg, currentStockKg, reorderLevelKg, category, unit, costPerKg } = req.body;
    if (!name) return res.status(400).json({ message: "Silo name is required" });

    const code = name.toLowerCase().replace(/[^a-z0-9]/g, "_");

    const silo = await FeedSilo.create({
      name: name.trim(),
      code,
      capacityKg: Number(capacityKg) || 10000,
      currentStockKg: Number(currentStockKg) || 0,
      reorderLevelKg: Number(reorderLevelKg) || 2000,
      category: category || "poultry",
      unit: unit || "kg",
      costPerKg: Number(costPerKg) || 0,
      createdBy: req.user?._id,
    });

    res.status(201).json({ success: true, message: "Feed silo created", silo });
  } catch (error) {
    res.status(500).json({ message: "Failed to create feed silo", error: error.message });
  }
};

// @desc    Update feed silo info
// @route   PUT /api/feed/silos/:id
// @access  Private (Admin / Manager)
exports.updateFeedSilo = async (req, res) => {
  try {
    const silo = await FeedSilo.findById(req.params.id);
    if (!silo) return res.status(404).json({ message: "Feed silo not found" });

    const { name, capacityKg, currentStockKg, reorderLevelKg, category, costPerKg } = req.body;
    if (name !== undefined) {
      silo.name = name.trim();
      silo.code = name.toLowerCase().replace(/[^a-z0-9]/g, "_");
    }
    if (capacityKg !== undefined) silo.capacityKg = Math.max(100, Number(capacityKg));
    if (currentStockKg !== undefined) silo.currentStockKg = Math.max(0, Number(currentStockKg));
    if (reorderLevelKg !== undefined) silo.reorderLevelKg = Math.max(0, Number(reorderLevelKg));
    if (category !== undefined) silo.category = category;
    if (costPerKg !== undefined) silo.costPerKg = Number(costPerKg);

    await silo.save();
    res.status(200).json({ success: true, message: "Feed silo updated", silo });
  } catch (error) {
    res.status(500).json({ message: "Failed to update feed silo", error: error.message });
  }
};

// @desc    Delete or archive feed silo
// @route   DELETE /api/feed/silos/:id
// @access  Private (Admin)
exports.deleteFeedSilo = async (req, res) => {
  try {
    const silo = await FeedSilo.findById(req.params.id);
    if (!silo) return res.status(404).json({ message: "Feed silo not found" });

    silo.status = "archived";
    await silo.save();
    res.status(200).json({ success: true, message: "Feed silo archived" });
  } catch (error) {
    res.status(500).json({ message: "Failed to archive feed silo", error: error.message });
  }
};

// Helper: seed initial demo transactions matching user screenshot
const seedInitialTransactionsIfEmpty = async (userId) => {
  const count = await FeedTransaction.countDocuments();
  if (count === 0) {
    const ownFeedSilo = await FeedSilo.findOne({ code: "own_feed" }) || await FeedSilo.findOne();
    if (!ownFeedSilo) return;

    const samples = [
      { date: new Date("2026-10-13"), type: "DEBIT", silo: ownFeedSilo._id, feedType: ownFeedSilo.name, quantity: 750, description: "Daily broiler feeding flock #1" },
      { date: new Date("2026-10-12"), type: "DEBIT", silo: ownFeedSilo._id, feedType: ownFeedSilo.name, quantity: 700, description: "Poultry and livestock evening feeding" },
      { date: new Date("2026-10-11"), type: "DEBIT", silo: ownFeedSilo._id, feedType: ownFeedSilo.name, quantity: 600, description: "Brooder batch feeding" },
      { date: new Date("2026-10-10"), type: "DEBIT", silo: ownFeedSilo._id, feedType: ownFeedSilo.name, quantity: 560, description: "Cattle and poultry mixed ration" },
      { date: new Date("2026-10-08"), type: "CREDIT", silo: ownFeedSilo._id, feedType: ownFeedSilo.name, quantity: 5000, description: "Mixing station batch production" },
    ];

    for (const sample of samples) {
      await FeedTransaction.create({
        ...sample,
        source: "manual",
        recordedBy: userId || null,
      });
    }
  }
};

// @desc    Get feed transactions with date range and filters
// @route   GET /api/feed/transactions
// @access  Private
exports.getFeedTransactions = async (req, res) => {
  try {
    await seedInitialTransactionsIfEmpty(req.user?._id);

    const { startDate, endDate, siloId, feedType, type, source } = req.query;
    const filter = {};

    if (startDate && endDate) {
      filter.date = {
        $gte: startOfDay(new Date(startDate)),
        $lte: endOfDay(new Date(endDate)),
      };
    } else if (startDate) {
      filter.date = { $gte: startOfDay(new Date(startDate)) };
    } else if (endDate) {
      filter.date = { $lte: endOfDay(new Date(endDate)) };
    }

    if (siloId) filter.silo = siloId;
    if (feedType) filter.feedType = new RegExp(feedType, "i");
    if (type && type !== "all") filter.type = type.toUpperCase();
    if (source && source !== "all") filter.source = source;

    const transactions = await FeedTransaction.find(filter)
      .populate("silo", "name code capacityKg currentStockKg")
      .populate("relatedPoultryBatch", "name breed poultryType houseNo")
      .populate("relatedPoultryBrooder", "batchName houseName")
      .populate("relatedAnimal", "tagId name species breed")
      .populate("recordedBy", "name role")
      .sort({ date: -1, createdAt: -1 });

    const totalDebitKg = transactions.filter((t) => t.type === "DEBIT").reduce((sum, t) => sum + t.quantity, 0);
    const totalCreditKg = transactions.filter((t) => t.type === "CREDIT").reduce((sum, t) => sum + t.quantity, 0);

    res.status(200).json({
      success: true,
      count: transactions.length,
      totalDebitKg,
      totalCreditKg,
      transactions,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch feed transactions", error: error.message });
  }
};

// @desc    Create feed transaction (Credit / Debit) and adjust silo stock
// @route   POST /api/feed/transactions
// @access  Private
exports.createFeedTransaction = async (req, res) => {
  try {
    const {
      date,
      type, // "CREDIT" | "DEBIT"
      siloId,
      feedType,
      quantity,
      unitPrice,
      source, // "manual", "poultry", "animal", "purchase", "spoilage"
      relatedPoultryBatch,
      relatedPoultryBrooder,
      relatedAnimal,
      vendor,
      description,
    } = req.body;

    if (!type || !["CREDIT", "DEBIT"].includes(type.toUpperCase())) {
      return res.status(400).json({ message: "Type must be 'CREDIT' or 'DEBIT'" });
    }
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      return res.status(400).json({ message: "Quantity must be a positive number" });
    }

    let silo = null;
    if (siloId) {
      silo = await FeedSilo.findById(siloId);
    } else if (feedType) {
      silo = await FeedSilo.findOne({ name: new RegExp(`^${feedType.trim()}$`, "i") });
    }

    if (!silo) {
      return res.status(404).json({ message: "Feed silo / feed type not found" });
    }

    // Adjust silo stock atomically
    if (type.toUpperCase() === "CREDIT") {
      silo.currentStockKg = (silo.currentStockKg || 0) + qty;
    } else {
      silo.currentStockKg = Math.max(0, (silo.currentStockKg || 0) - qty);
    }
    await silo.save();

    const price = Number(unitPrice) || silo.costPerKg || 0;
    const totalAmount = price * qty;

    const transaction = await FeedTransaction.create({
      date: date ? new Date(date) : new Date(),
      type: type.toUpperCase(),
      silo: silo._id,
      feedType: silo.name,
      quantity: qty,
      unit: silo.unit || "kg",
      unitPrice: price,
      totalAmount,
      source: source || "manual",
      relatedPoultryBatch: relatedPoultryBatch || null,
      relatedPoultryBrooder: relatedPoultryBrooder || null,
      relatedAnimal: relatedAnimal || null,
      vendor: vendor || "",
      description: description || (type.toUpperCase() === "DEBIT" ? `Consumed ${qty} kg ${silo.name}` : `Added ${qty} kg ${silo.name}`),
      recordedBy: req.user?._id,
    });

    // If an animal was linked, record feeding log on Animal document
    if (relatedAnimal && type.toUpperCase() === "DEBIT") {
      try {
        const animal = await Animal.findById(relatedAnimal);
        if (animal) {
          animal.feedingLogs.push({
            date: transaction.date,
            feedType: silo.name,
            quantityKg: qty,
            notes: description || `Fed ${qty} kg from ${silo.name}`,
            feedTransaction: transaction._id,
            recordedBy: req.user?._id,
          });
          await animal.save();
        }
      } catch (e) {
        console.error("Animal feeding log sync error:", e.message);
      }
    }

    const populated = await FeedTransaction.findById(transaction._id)
      .populate("silo", "name code capacityKg currentStockKg")
      .populate("relatedPoultryBatch", "name breed")
      .populate("relatedAnimal", "tagId name species");

    res.status(201).json({
      success: true,
      message: `Feed transaction recorded (${type.toUpperCase()})`,
      transaction: populated,
      silo,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to record feed transaction", error: error.message });
  }
};

// @desc    Update feed transaction and adjust difference in silo
// @route   PUT /api/feed/transactions/:id
// @access  Private
exports.updateFeedTransaction = async (req, res) => {
  try {
    const tx = await FeedTransaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ message: "Feed transaction not found" });

    const silo = await FeedSilo.findById(tx.silo);
    if (!silo) return res.status(404).json({ message: "Associated feed silo not found" });

    const { date, quantity, type, description, vendor, unitPrice } = req.body;

    // First revert original impact
    if (tx.type === "CREDIT") {
      silo.currentStockKg = Math.max(0, silo.currentStockKg - tx.quantity);
    } else {
      silo.currentStockKg += tx.quantity;
    }

    // Apply new values
    const newType = (type || tx.type).toUpperCase();
    const newQty = quantity !== undefined ? Number(quantity) : tx.quantity;

    if (newType === "CREDIT") {
      silo.currentStockKg += newQty;
    } else {
      silo.currentStockKg = Math.max(0, silo.currentStockKg - newQty);
    }
    await silo.save();

    if (date) tx.date = new Date(date);
    tx.type = newType;
    tx.quantity = newQty;
    if (description !== undefined) tx.description = description;
    if (vendor !== undefined) tx.vendor = vendor;
    if (unitPrice !== undefined) {
      tx.unitPrice = Number(unitPrice);
      tx.totalAmount = tx.unitPrice * newQty;
    }

    await tx.save();

    res.status(200).json({
      success: true,
      message: "Transaction updated",
      transaction: tx,
      silo,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update feed transaction", error: error.message });
  }
};

// @desc    Delete feed transaction and revert silo quantity
// @route   DELETE /api/feed/transactions/:id
// @access  Private (Admin / Manager)
exports.deleteFeedTransaction = async (req, res) => {
  try {
    const tx = await FeedTransaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ message: "Feed transaction not found" });

    const silo = await FeedSilo.findById(tx.silo);
    if (silo) {
      if (tx.type === "CREDIT") {
        silo.currentStockKg = Math.max(0, silo.currentStockKg - tx.quantity);
      } else {
        silo.currentStockKg += tx.quantity;
      }
      await silo.save();
    }

    await tx.deleteOne();

    res.status(200).json({ success: true, message: "Transaction deleted and stock reverted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete transaction", error: error.message });
  }
};

// @desc    Execute feed mixing operation in the Mixing Station
// @route   POST /api/feed/mix
// @access  Private (Admin / Manager)
exports.executeMixingStation = async (req, res) => {
  try {
    const { targetSiloId, targetQuantityKg, ingredients, notes } = req.body;
    // ingredients: [ { siloId, quantityKg } ]

    if (!targetSiloId || !targetQuantityKg || Number(targetQuantityKg) <= 0) {
      return res.status(400).json({ message: "targetSiloId and positive targetQuantityKg are required" });
    }
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ message: "At least one ingredient silo is required for mixing" });
    }

    const targetSilo = await FeedSilo.findById(targetSiloId);
    if (!targetSilo) return res.status(404).json({ message: "Target feed silo not found" });

    // Validate all ingredient silos have sufficient stock
    const ingredientDocs = [];
    for (const item of ingredients) {
      const ingSilo = await FeedSilo.findById(item.siloId);
      if (!ingSilo) {
        return res.status(404).json({ message: `Ingredient silo ${item.siloId} not found` });
      }
      const needQty = Number(item.quantityKg);
      if (ingSilo.currentStockKg < needQty) {
        return res.status(400).json({
          message: `Insufficient stock in '${ingSilo.name}'. Available: ${ingSilo.currentStockKg} kg, Required: ${needQty} kg`,
        });
      }
      ingredientDocs.push({ silo: ingSilo, quantityKg: needQty });
    }

    const mixingBatchId = `MIX-${Date.now().toString().slice(-6)}`;
    const createdTransactions = [];

    // 1. Deduct from all ingredient silos and record DEBIT
    for (const ing of ingredientDocs) {
      ing.silo.currentStockKg = Math.max(0, ing.silo.currentStockKg - ing.quantityKg);
      await ing.silo.save();

      const tx = await FeedTransaction.create({
        date: new Date(),
        type: "DEBIT",
        silo: ing.silo._id,
        feedType: ing.silo.name,
        quantity: ing.quantityKg,
        source: "mixing",
        mixingBatchId,
        description: `Mixed into ${targetSilo.name} (${mixingBatchId})`,
        recordedBy: req.user?._id,
      });
      createdTransactions.push(tx);
    }

    // 2. Add produced quantity to target silo and record CREDIT
    const produceQty = Number(targetQuantityKg);
    targetSilo.currentStockKg = (targetSilo.currentStockKg || 0) + produceQty;
    await targetSilo.save();

    const creditTx = await FeedTransaction.create({
      date: new Date(),
      type: "CREDIT",
      silo: targetSilo._id,
      feedType: targetSilo.name,
      quantity: produceQty,
      source: "mixing",
      mixingBatchId,
      description: `Mixing Station batch produced: ${produceQty} kg ${targetSilo.name} (${mixingBatchId}) ${notes ? `- ${notes}` : ""}`,
      recordedBy: req.user?._id,
    });
    createdTransactions.push(creditTx);

    res.status(200).json({
      success: true,
      message: `Mixing completed successfully! Produced ${produceQty} kg of ${targetSilo.name} [Batch: ${mixingBatchId}]`,
      mixingBatchId,
      targetSilo,
      transactions: createdTransactions,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to execute mixing station", error: error.message });
  }
};

// Internal exported helper to deduct feed stock from Poultry & Animal modules
exports.deductFeedStock = async ({
  siloId,
  feedType,
  quantityKg,
  source = "poultry",
  relatedPoultryBatch,
  relatedPoultryBrooder,
  relatedAnimal,
  description,
  userId,
}) => {
  try {
    const qty = Number(quantityKg);
    if (!qty || qty <= 0) return null;

    let silo = null;
    if (siloId) silo = await FeedSilo.findById(siloId);
    if (!silo && feedType) {
      silo = await FeedSilo.findOne({ name: new RegExp(`^${feedType.trim()}$`, "i") });
    }
    if (!silo) {
      // Default to appropriate silo based on source
      if (source === "brooder") silo = await FeedSilo.findOne({ code: "pre_starter" }) || await FeedSilo.findOne({ code: "starter" });
      else if (source === "poultry") silo = await FeedSilo.findOne({ code: "grower" }) || await FeedSilo.findOne({ code: "starter" });
      else if (source === "animal") silo = await FeedSilo.findOne({ code: "cattle_feed" }) || await FeedSilo.findOne({ code: "own_feed" });
    }

    if (!silo) silo = await FeedSilo.findOne();
    if (!silo) return null;

    silo.currentStockKg = Math.max(0, silo.currentStockKg - qty);
    await silo.save();

    const tx = await FeedTransaction.create({
      date: new Date(),
      type: "DEBIT",
      silo: silo._id,
      feedType: silo.name,
      quantity: qty,
      unit: silo.unit || "kg",
      source,
      relatedPoultryBatch: relatedPoultryBatch || null,
      relatedPoultryBrooder: relatedPoultryBrooder || null,
      relatedAnimal: relatedAnimal || null,
      description: description || `Consumed ${qty} kg ${silo.name} for ${source}`,
      recordedBy: userId || null,
    });

    return { silo, transaction: tx };
  } catch (err) {
    console.error("deductFeedStock error:", err.message);
    return null;
  }
};
