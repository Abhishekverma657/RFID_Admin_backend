const express = require("express");
const router = express.Router();
const resultController = require("../controllers/result.controller");
const { protectTestStudent } = require("../middleware/test-auth.middleware");

// Admin routes - TODO: Add admin auth middleware when implementing admin auth
router.get("/", resultController.getAllResults);
router.get("/:id/detail", resultController.getResultDetail);
router.put("/:id/review", resultController.updateReviewStatus);

// Student routes - protected
router.get("/my-result", protectTestStudent, resultController.getMyResult);

module.exports = router;
