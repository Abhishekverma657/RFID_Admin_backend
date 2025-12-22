const express = require("express");
const router = express.Router();





router.use("/auth", require("./modules/auth/auth.routes"));
router.use("/institutes", require("./modules/institutes/institute.routes"));
router.use("/users", require("./modules/users/user.routes"));
router.use("/students", require("./modules/students/student.routes"));
router.use("/teachers", require("./modules/teachers/teacher.routes"));
router.use("/attendance", require("./modules/attendance/attendance.routes"));
router.use("/classes", require("./modules/classes/class.routes"));
router.use("/subjects", require("./modules/subjects/subject.routes"));
router.use("/roster", require("./modules/roster/roster.routes"));
router.use("/test-system", require("./modules/test-system/index.routes"));






module.exports = router;
