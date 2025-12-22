const express = require("express");
const router = express.Router();
const testController = require("../controllers/test.controller");

// Admin routes for test management
router.post("/", testController.createTest);
router.get("/", testController.getTests);
router.get("/:id", testController.getTestById);
router.put("/:id", testController.updateTest);
router.delete("/:id", testController.deleteTest);
router.get("/:id/link", testController.getTestLink);

module.exports = router;
