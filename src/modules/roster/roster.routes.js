const router = require("express").Router();
const controller = require("./roster.controller");
const { protect } = require("../auth/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");

router.post(
  "/",
  protect,
  allowRoles("ADMIN"),
  controller.saveRoster
);

router.get(
  "/",
  protect,
  allowRoles("ADMIN"),
  controller.getAllRosters
);

router.delete(
  "/:id",
  protect,
  allowRoles("ADMIN"),
  controller.deleteRoster
);

// router.get(
//   "/:classId",
//   protect,
//   allowRoles("ADMIN"),
//   controller.getRoster
// );

module.exports = router;
