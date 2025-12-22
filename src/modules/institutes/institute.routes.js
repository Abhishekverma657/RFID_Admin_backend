const router = require("express").Router();
const controller = require("./institute.controller");
const { protect } = require("../auth/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");

router.post(
  "/",
  protect,
  allowRoles("SUPER_ADMIN"),
  controller.createInstitute
);

// Super admin: get all institutes with student/teacher counts
router.get("/",
  protect,
  allowRoles("SUPER_ADMIN"),
   controller.getInstitutesWithCounts)
   
router.get(
  "/:id",
  protect,
  allowRoles("SUPER_ADMIN"),
  controller.getInstituteDetails
);

router.get(
  "/:id/stats",
  protect,
  allowRoles("ADMIN"),
  controller.getInstituteStats
);

module.exports = router;
