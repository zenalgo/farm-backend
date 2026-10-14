const express = require("express");
const router = express.Router();
const {
  getFeedSilos,
  createFeedSilo,
  updateFeedSilo,
  deleteFeedSilo,
  getFeedTransactions,
  createFeedTransaction,
  updateFeedTransaction,
  deleteFeedTransaction,
  executeMixingStation,
  getDailyAutoFeedingPreview,
  executeDailyAutoFeeding,
} = require("../controllers/feedController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);

// Silos
router.get("/silos", getFeedSilos);
router.post("/silos", authorize("admin", "manager_operations"), createFeedSilo);
router.put("/silos/:id", authorize("admin", "manager_operations"), updateFeedSilo);
router.delete("/silos/:id", authorize("admin", "manager_operations"), deleteFeedSilo);

// Transactions
router.get("/transactions", getFeedTransactions);
router.post("/transactions", createFeedTransaction);
router.put("/transactions/:id", authorize("admin", "manager_operations"), updateFeedTransaction);
router.delete("/transactions/:id", authorize("admin", "manager_operations"), deleteFeedTransaction);

// Mixing Station
router.post("/mix", authorize("admin", "manager_operations"), executeMixingStation);

// Auto Daily Feeding Engine
router.get("/auto-preview", getDailyAutoFeedingPreview);
router.post("/auto-deduct", authorize("admin", "manager_operations", "field_manager"), executeDailyAutoFeeding);

module.exports = router;
