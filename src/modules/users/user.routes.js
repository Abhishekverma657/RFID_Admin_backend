const router = require("express").Router();
const controller = require("./user.controller");
const { protect } = require("../auth/auth.middleware");

router.post("/change-password", protect, controller.changePassword);

module.exports = router;
