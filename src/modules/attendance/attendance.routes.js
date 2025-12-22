const router = require("express").Router();
const controller = require("./attendance.controller");
const { protect } = require("../auth/auth.middleware");
const { markAbsentForDate } = require("./mark_absent_scheduler");

router.post("/rfid", protect, controller.markRFID);
router.post("/face", protect, controller.markFace);
router.get("/institute/:instituteId", protect, controller.getInstituteAttendance);
router.get("/student/:studentId", protect, controller.getStudentAttendance);
// router.get(
//   "/institute/:instituteId/all-today",
//   protect,
//   controller.getAllStudentsAttendanceToday
// );



router.post("/attendance-close", async (req, res) => {
  const { date } = req.body;

  if (!date) {
    return res.status(400).json({
      success: false,
      message: "date is required (YYYY-MM-DD)",
    });
  }

  const count = await markAbsentForDate(date);

  res.json({
    success: true,
    message: "Attendance closed successfully",
    date,
    absenteesMarked: count,
  });
});

module.exports = router;
