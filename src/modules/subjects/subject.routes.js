const router = require("express").Router();
const controller = require("./subject.controller");
const { protect } = require("../auth/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");

router.post("/", protect, allowRoles("ADMIN"), controller.addSubject);
router.get("/", protect, allowRoles("ADMIN"), controller.getSubjects);
router.delete("/:id", protect, allowRoles("ADMIN"), controller.deleteSubject);

module.exports = router;
