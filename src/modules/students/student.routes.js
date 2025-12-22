const router = require("express").Router();
const controller = require("./student.controller");
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
 controller.importStudents
);


router.get(
  "/",
  protect,
  allowRoles("ADMIN"),
  controller.getStudents
);
router.put(
  "/:id",
  protect,
  allowRoles("ADMIN"),
  controller.updateStudent
);
router.delete(
  "/:id",
  protect,
  allowRoles("ADMIN"),
  controller.deleteStudent
);

router.post(
  "/",
  protect,
  allowRoles("ADMIN"),
  controller.addStudent
);




module.exports = router;
