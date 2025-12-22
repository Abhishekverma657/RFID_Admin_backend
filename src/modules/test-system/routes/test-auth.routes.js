const express = require("express");
const router = express.Router();
const testAuthController = require("../controllers/test-auth.controller");

// Public routes for student authentication
router.post("/request-otp", testAuthController.requestOTP);
router.post("/verify-otp", testAuthController.verifyOTP);

module.exports = router;
