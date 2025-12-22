const router = require("express").Router();
const controller = require("./class.controller");
const { protect } = require("../auth/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");

router.post("/", protect, allowRoles("ADMIN"), controller.addClass);
router.get("/", protect, allowRoles("ADMIN"), controller.getClasses);
router.delete("/:id", protect, allowRoles("ADMIN"), controller.deleteClass);

module.exports = router;
