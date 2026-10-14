const express = require("express");
const router = express.Router();
const {
  createPatch,
  getPatches,
  updatePatch,
  submitPatchWork,
  reviewPatchWork,
  deletePatch,
} = require("../controllers/fieldPatchController");
const { protect, authorize } = require("../middleware/auth");
const { uploadSinglePhoto } = require("../middleware/upload");

router.use(protect);

router
  .route("/")
  .post(authorize("admin", "manager_operations"), uploadSinglePhoto, createPatch)
  .get(getPatches);

// Worker submits proof of work
router.put("/:id/submit-proof", uploadSinglePhoto, submitPatchWork);

// ONLY Admin reviews submitted proof (Approve / Decline)
router.put("/:id/review", authorize("admin"), reviewPatchWork);

router
  .route("/:id")
  .put(uploadSinglePhoto, updatePatch)
  .delete(authorize("admin", "manager_operations"), deletePatch);

module.exports = router;
