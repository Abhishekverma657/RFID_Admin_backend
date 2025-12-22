const express = require("express");
const router = express.Router();
const testEngineController = require("../controllers/test-engine.controller");
const { protectTestStudent } = require("../middleware/test-auth.middleware");

// Protected routes for test students
router.use(protectTestStudent); // All routes require JWT authentication

router.get("/start", testEngineController.startTest);
router.post("/save-answer", testEngineController.saveAnswer);
router.post("/submit", testEngineController.submitTest);
router.get("/time-remaining", testEngineController.getTimeRemaining);
router.post("/violation", testEngineController.logViolation);
router.post("/snapshot", testEngineController.uploadSnapshot);

module.exports = router;
