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
  // Poultry Feeds
  { name: "Pre-Starter", code: "pre_starter", capacityKg: 10000, currentStockKg: 1200, reorderLevelKg: 2000, category: "poultry", categoryLabel: "Poultry Feed" },
  { name: "Starter", code: "starter", capacityKg: 10000, currentStockKg: 5600, reorderLevelKg: 2000, category: "poultry", categoryLabel: "Poultry Feed" },
  { name: "Grower", code: "grower", capacityKg: 10000, currentStockKg: 6700, reorderLevelKg: 2000, category: "poultry", categoryLabel: "Poultry Feed" },
  { name: "Finisher", code: "finisher", capacityKg: 10000, currentStockKg: 3200, reorderLevelKg: 2000, category: "poultry", categoryLabel: "Poultry Feed" },
  // Cattle & Dairy Feeds
  { name: "Cattle Feed (Pellets)", code: "cattle_feed", capacityKg: 10000, currentStockKg: 4500, reorderLevelKg: 2000, category: "cattle", categoryLabel: "Cattle Feed" },
  { name: "Mustard Cake (Sarson Khal)", code: "sarson_khal", capacityKg: 5000, currentStockKg: 1800, reorderLevelKg: 1000, category: "cattle", categoryLabel: "Cattle Feed", isFillerOrRawMaterial: true },
  // Goat & Sheep Feeds
  { name: "Goat Feed (Pellets)", code: "goat_feed", capacityKg: 5000, currentStockKg: 2800, reorderLevelKg: 1000, category: "goat", categoryLabel: "Goat Feed" },
  // Fodder & Roughage (Bhusa / Chari)
  { name: "Wheat Straw (Gehu Bhusa)", code: "wheat_straw_bhusa", capacityKg: 15000, currentStockKg: 6500, reorderLevelKg: 3000, category: "fodder", categoryLabel: "Fodder & Roughage", isFillerOrRawMaterial: true },
  { name: "Green Fodder (Chari/Berseem)", code: "green_fodder", capacityKg: 20000, currentStockKg: 8500, reorderLevelKg: 4000, category: "fodder", categoryLabel: "Fodder & Roughage" },
  // Raw Materials & Grains
  { name: "Yellow Maize (Makka)", code: "maize_makka", capacityKg: 15000, currentStockKg: 7200, reorderLevelKg: 3000, category: "raw_material", categoryLabel: "Raw Material", isFillerOrRawMaterial: true },
  { name: "Soybean Meal (DOC)", code: "soya_doc", capacityKg: 10000, currentStockKg: 3500, reorderLevelKg: 2000, category: "raw_material", categoryLabel: "Raw Material", isFillerOrRawMaterial: true },
  // Fillers & Supplements (Minerals, Salt, Calcite)
  { name: "Mineral Mixture (Chelated)", code: "mineral_mixture", capacityKg: 2000, currentStockKg: 650, reorderLevelKg: 300, category: "fillers", categoryLabel: "Fillers & Supplements", isFillerOrRawMaterial: true },
  { name: "Calcium / Calcite Powder", code: "calcite_powder", capacityKg: 3000, currentStockKg: 950, reorderLevelKg: 500, category: "fillers", categoryLabel: "Fillers & Supplements", isFillerOrRawMaterial: true },
  { name: "Common Salt", code: "common_salt", capacityKg: 1000, currentStockKg: 300, reorderLevelKg: 150, category: "fillers", categoryLabel: "Fillers & Supplements", isFillerOrRawMaterial: true },
  // Custom / Farm Made Mix
  { name: "Own Feed", code: "own_feed", capacityKg: 10000, currentStockKg: 4200, reorderLevelKg: 1500, category: "general", categoryLabel: "Farm Mixed Feed" },
];

// Helper to seed silos if none exist or seed missing farmhouse silos
const ensureDefaultSilos = async (userId) => {
  for (const item of DEFAULT_SILOS) {
    const exists = await FeedSilo.findOne({ code: item.code });
    if (!exists) {
      await FeedSilo.create({ ...item, createdBy: userId || null });
    }
  }
};

// Helper: check low stock and notify Admin & Managers
const checkAndNotifyLowStock = async (silo) => {
  if (!silo || (silo.currentStockKg || 0) > (silo.reorderLevelKg || 2000)) return;
  try {
    const Notification = require("../models/Notification");
    const { createNotificationForRoles } = require("./notificationController");

    const recent = await Notification.findOne({
      type: "inventory",
      "metadata.siloId": silo._id,
      createdAt: { $gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
    });

    if (!recent) {
      await createNotificationForRoles({
        roles: ["admin", "manager_operations", "field_manager"],
        title: `⚠️ Low Feed Stock Alert: ${silo.name}`,
        message: `Silo "${silo.name}" has only ${silo.currentStockKg} kg stock left (below reorder threshold of ${silo.reorderLevelKg} kg). Please refill or mix feed.`,
        type: "inventory",
        link: "/feed-management",
        metadata: { siloId: silo._id, siloName: silo.name, currentStockKg: silo.currentStockKg },
      });
    }
  } catch (err) {
    console.error("checkAndNotifyLowStock error:", err.message);
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

    // Calculate Category Breakdown (Poultry, Cattle, Goat, Fodder, Raw Material, Fillers, General, and Custom)
    const categorySummary = {
      poultry: {
        label: "Poultry Feed",
        sublabel: "Pre-Starter, Starter, Grower, Finisher",
        icon: "🐔",
        stockKg: 0,
        capacityKg: 0,
        silosCount: 0,
      },
      cattle: {
        label: "Cattle Feed",
        sublabel: "Cow & Buffalo Rations, Khal",
        icon: "🐄",
        stockKg: 0,
        capacityKg: 0,
        silosCount: 0,
      },
      goat: {
        label: "Goat Feed",
        sublabel: "Caprine Feed & Pellets",
        icon: "🐐",
        stockKg: 0,
        capacityKg: 0,
        silosCount: 0,
      },
      fodder: {
        label: "Fodder & Roughage",
        sublabel: "Wheat Straw (Bhusa), Green Chari",
        icon: "🌾",
        stockKg: 0,
        capacityKg: 0,
        silosCount: 0,
      },
      raw_material: {
        label: "Raw Materials",
        sublabel: "Yellow Maize, Soya DOC, Grains",
        icon: "🌽",
        stockKg: 0,
        capacityKg: 0,
        silosCount: 0,
      },
      fillers: {
        label: "Fillers & Minerals",
        sublabel: "Mineral Mix, Calcite, Salt",
        icon: "🧪",
        stockKg: 0,
        capacityKg: 0,
        silosCount: 0,
      },
      general: {
        label: "General / Farm Mix",
        sublabel: "Custom Farm-Mixed Rations",
        icon: "⚙️",
        stockKg: 0,
        capacityKg: 0,
        silosCount: 0,
      },
    };

    silos.forEach((s) => {
      const cat = (s.category || "general").toLowerCase();
      if (!categorySummary[cat]) {
        categorySummary[cat] = {
          label: s.categoryLabel || cat.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          sublabel: "Custom Category",
          icon: "📦",
          stockKg: 0,
          capacityKg: 0,
          silosCount: 0,
        };
      }
      categorySummary[cat].stockKg += (s.currentStockKg || 0);
      categorySummary[cat].capacityKg += (s.capacityKg || 0);
      categorySummary[cat].silosCount += 1;
    });

    res.status(200).json({
      success: true,
      count: silos.length,
      totalStockKg,
      totalCapacityKg,
      lowStockCount,
      categorySummary,
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
    const { name, capacityKg, currentStockKg, reorderLevelKg, category, categoryLabel, unit, costPerKg, isFillerOrRawMaterial, description } = req.body;
    if (!name) return res.status(400).json({ message: "Feed item / silo name is required" });

    const code = name.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_" + Date.now().toString().slice(-4);

    const silo = await FeedSilo.create({
      name: name.trim(),
      code,
      capacityKg: Number(capacityKg) || 10000,
      currentStockKg: Number(currentStockKg) || 0,
      reorderLevelKg: Number(reorderLevelKg) || 2000,
      category: (category || "general").toLowerCase().trim(),
      categoryLabel: categoryLabel ? categoryLabel.trim() : "",
      isFillerOrRawMaterial: Boolean(isFillerOrRawMaterial),
      description: description ? description.trim() : "",
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

    const { name, capacityKg, currentStockKg, reorderLevelKg, category, categoryLabel, unit, costPerKg, isFillerOrRawMaterial, description } = req.body;
    if (name !== undefined) {
      silo.name = name.trim();
    }
    if (capacityKg !== undefined) silo.capacityKg = Math.max(10, Number(capacityKg));
    if (currentStockKg !== undefined) silo.currentStockKg = Math.max(0, Number(currentStockKg));
    if (reorderLevelKg !== undefined) silo.reorderLevelKg = Math.max(0, Number(reorderLevelKg));
    if (category !== undefined) silo.category = category.toLowerCase().trim();
    if (categoryLabel !== undefined) silo.categoryLabel = categoryLabel ? categoryLabel.trim() : "";
    if (unit !== undefined) silo.unit = unit;
    if (costPerKg !== undefined) silo.costPerKg = Number(costPerKg);
    if (isFillerOrRawMaterial !== undefined) silo.isFillerOrRawMaterial = Boolean(isFillerOrRawMaterial);
    if (description !== undefined) silo.description = description;

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
    if (type.toUpperCase() === "DEBIT") {
      checkAndNotifyLowStock(silo);
    }

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
    checkAndNotifyLowStock(silo);

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

// @desc    Get preview of active animals and daily calculated rations
// @route   GET /api/feed/auto-preview
// @access  Private
exports.getDailyAutoFeedingPreview = async (req, res) => {
  try {
    const todayStart = startOfDay(new Date());

    const animals = await Animal.find({ status: "active" });
    const cowsCount = animals.filter((a) => a.species === "cow").length;
    const buffaloesCount = animals.filter((a) => a.species === "buffalo").length;
    const goatsCount = animals.filter((a) => a.species === "goat").length;
    const dogsCount = animals.filter((a) => a.species === "dog").length;

    const batches = await PoultryBatch.find({ status: { $ne: "culled" } });
    const poultryBirdsCount = batches.reduce((sum, b) => sum + (b.totalChicksReceived || b.birdsCount || b.chicksReceived || 0), 0);

    // Standard daily rations per animal (kg/day)
    const cowRationKg = 8;
    const buffaloRationKg = 10;
    const goatRationKg = 1.5;
    const poultryBirdRationKg = 0.12;

    const includePoultry = req.query.includePoultry === "true";

    const calculatedCattleFeedKg = (cowsCount * cowRationKg) + (buffaloesCount * buffaloRationKg);
    const calculatedGoatFeedKg = Number((goatsCount * goatRationKg).toFixed(1));
    const calculatedPoultryFeedKg = includePoultry ? Math.round(poultryBirdsCount * poultryBirdRationKg) : 0;

    const cattleSilo = await FeedSilo.findOne({ code: "cattle_feed" }) || await FeedSilo.findOne({ category: "cattle" });
    const goatSilo = await FeedSilo.findOne({ code: "goat_feed" }) || await FeedSilo.findOne({ category: "goat" });
    const poultrySilo = await FeedSilo.findOne({ code: "grower" }) || await FeedSilo.findOne({ category: "poultry" });

    // Check if auto-feeding already ran today
    const existingAutoToday = await FeedTransaction.find({
      source: "auto_schedule",
      date: { $gte: todayStart },
    }).populate("silo", "name");

    res.status(200).json({
      success: true,
      alreadyRunToday: existingAutoToday.length > 0,
      todayDeductions: existingAutoToday,
      counts: {
        cows: cowsCount,
        buffaloes: buffaloesCount,
        goats: goatsCount,
        dogs: dogsCount,
        poultryBirds: poultryBirdsCount,
      },
      rates: {
        cowRationKg,
        buffaloRationKg,
        goatRationKg,
        poultryBirdRationKg,
      },
      calculated: {
        cattleFeedKg: calculatedCattleFeedKg,
        goatFeedKg: calculatedGoatFeedKg,
        poultryFeedKg: calculatedPoultryFeedKg,
        totalKg: calculatedCattleFeedKg + calculatedGoatFeedKg + calculatedPoultryFeedKg,
      },
      silos: {
        cattle: { id: cattleSilo?._id, name: cattleSilo?.name || "Cattle Feed", availableKg: cattleSilo?.currentStockKg || 0 },
        goat: { id: goatSilo?._id, name: goatSilo?.name || "Goat Feed", availableKg: goatSilo?.currentStockKg || 0 },
        poultry: { id: poultrySilo?._id, name: poultrySilo?.name || "Grower / Poultry", availableKg: poultrySilo?.currentStockKg || 0 },
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to generate auto-feeding preview", error: error.message });
  }
};

// @desc    Execute automated daily feeding deduction across active livestock
// @route   POST /api/feed/auto-deduct
// @access  Private (Admin / Manager)
exports.executeDailyAutoFeeding = async (req, res) => {
  try {
    const { force, customRations } = req.body;
    const todayStart = startOfDay(new Date());

    if (!force) {
      const alreadyRun = await FeedTransaction.findOne({
        source: "auto_schedule",
        date: { $gte: todayStart },
      });
      if (alreadyRun) {
        return res.status(400).json({
          message: "Daily auto-feeding has already been executed for today. Use 'force: true' if you want to rerun.",
        });
      }
    }

    const animals = await Animal.find({ status: "active" });
    const cowsCount = animals.filter((a) => a.species === "cow").length;
    const buffaloesCount = animals.filter((a) => a.species === "buffalo").length;
    const goatsCount = animals.filter((a) => a.species === "goat").length;

    const batches = await PoultryBatch.find({ status: { $ne: "culled" } });
    const poultryBirdsCount = batches.reduce((sum, b) => sum + (b.totalChicksReceived || b.birdsCount || b.chicksReceived || 0), 0);

    const cowRate = customRations?.cowRationKg !== undefined ? Number(customRations.cowRationKg) : 8;
    const bufRate = customRations?.buffaloRationKg !== undefined ? Number(customRations.buffaloRationKg) : 10;
    const goatRate = customRations?.goatRationKg !== undefined ? Number(customRations.goatRationKg) : 1.5;
    const poultryRate = customRations?.poultryBirdRationKg !== undefined ? Number(customRations.poultryBirdRationKg) : (poultryBirdsCount > 0 ? 0.12 : 0);

    const includePoultry = req.body.includePoultry === true;
    const cattleFeedNeeded = (cowsCount * cowRate) + (buffaloesCount * bufRate);
    const goatFeedNeeded = Number((goatsCount * goatRate).toFixed(1));
    const poultryFeedNeeded = includePoultry ? Math.round(poultryBirdsCount * poultryRate) : 0;

    const createdTransactions = [];

    // 1. Deduct Cattle Feed
    if (cattleFeedNeeded > 0) {
      const cattleSilo = await FeedSilo.findOne({ code: "cattle_feed" }) || await FeedSilo.findOne({ category: "cattle" });
      if (cattleSilo) {
        cattleSilo.currentStockKg = Math.max(0, (cattleSilo.currentStockKg || 0) - cattleFeedNeeded);
        await cattleSilo.save();
        checkAndNotifyLowStock(cattleSilo);

        const tx = await FeedTransaction.create({
          date: new Date(),
          type: "DEBIT",
          silo: cattleSilo._id,
          feedType: cattleSilo.name,
          quantity: cattleFeedNeeded,
          source: "auto_schedule",
          description: `Auto Daily Feeding: ${cowsCount} Cow(s) (${cowsCount * cowRate}kg) & ${buffaloesCount} Buffalo(es) (${buffaloesCount * bufRate}kg)`,
          recordedBy: req.user?._id,
        });
        createdTransactions.push(tx);
      }
    }

    // 2. Deduct Goat Feed
    if (goatFeedNeeded > 0) {
      const goatSilo = await FeedSilo.findOne({ code: "goat_feed" }) || await FeedSilo.findOne({ category: "goat" });
      if (goatSilo) {
        goatSilo.currentStockKg = Math.max(0, (goatSilo.currentStockKg || 0) - goatFeedNeeded);
        await goatSilo.save();
        checkAndNotifyLowStock(goatSilo);

        const tx = await FeedTransaction.create({
          date: new Date(),
          type: "DEBIT",
          silo: goatSilo._id,
          feedType: goatSilo.name,
          quantity: goatFeedNeeded,
          source: "auto_schedule",
          description: `Auto Daily Feeding: ${goatsCount} Goat(s) @ ${goatRate}kg/day (${goatFeedNeeded}kg)`,
          recordedBy: req.user?._id,
        });
        createdTransactions.push(tx);
      }
    }

    // 3. Deduct Poultry Feed (if active birds)
    if (poultryFeedNeeded > 0) {
      const poultrySilo = await FeedSilo.findOne({ code: "grower" }) || await FeedSilo.findOne({ category: "poultry" });
      if (poultrySilo) {
        poultrySilo.currentStockKg = Math.max(0, (poultrySilo.currentStockKg || 0) - poultryFeedNeeded);
        await poultrySilo.save();
        checkAndNotifyLowStock(poultrySilo);

        const tx = await FeedTransaction.create({
          date: new Date(),
          type: "DEBIT",
          silo: poultrySilo._id,
          feedType: poultrySilo.name,
          quantity: poultryFeedNeeded,
          source: "auto_schedule",
          description: `Auto Daily Feeding: ${poultryBirdsCount} Poultry Birds (${poultryFeedNeeded}kg)`,
          recordedBy: req.user?._id,
        });
        createdTransactions.push(tx);
      }
    }

    res.status(200).json({
      success: true,
      message: `Daily auto-feeding executed! Deducted: ${cattleFeedNeeded}kg Cattle Feed, ${goatFeedNeeded}kg Goat Feed, ${poultryFeedNeeded}kg Poultry Feed`,
      transactions: createdTransactions,
      deductions: {
        cattleKg: cattleFeedNeeded,
        goatKg: goatFeedNeeded,
        poultryKg: poultryFeedNeeded,
        totalKg: cattleFeedNeeded + goatFeedNeeded + poultryFeedNeeded,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to execute daily auto-feeding", error: error.message });
  }
};
