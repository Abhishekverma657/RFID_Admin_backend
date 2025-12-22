const express = require("express");
const router = express.Router();
const authController = require("./auth.controller");
// const { protect } = require("./auth.middleware");
// const { allowRoles } = require("../../middlewares/role.middleware");

router.post("/login", authController.login);

// Super Admin create route (only SUPER_ADMIN can access)
router.post(
  "/create-super-admin",
 
  authController.createSuperAdmin
);

module.exports = router;
