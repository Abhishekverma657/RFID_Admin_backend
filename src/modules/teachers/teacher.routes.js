const router = require("express").Router();
const controller = require("./teacher.controller");
const upload = require("../../utils/upload");
const { protect } = require("../auth/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");

// router.post(
//   "/import",
//   protect,
//   allowRoles("ADMIN"),
//   upload.single("file"),
//   controller.importExcel
// );
router.post(
  "/import",
  protect,
  allowRoles("ADMIN"),
 controller.importTeachers
);

router.get(
  "/",
  protect,
  allowRoles("ADMIN"),
  controller.getTeachers
);

router.post(
  "/",
  protect,
  allowRoles("ADMIN"),
  controller.addTeacher
);

router.put(
  "/:id",
  protect,
  allowRoles("ADMIN"),
  controller.updateTeacher
);
router.delete(
  "/:id",
  protect,
  allowRoles("ADMIN"),
  controller.deleteTeacher
);

module.exports = router;
