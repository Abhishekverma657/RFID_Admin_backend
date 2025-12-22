// const cron = require("node-cron");
// const Student = require("../students/student.model");
// const Attendance = require("../attendance/attendance.model");

// function getToday() {
//   return new Date().toISOString().split("T")[0];
// }

// // Runs every day at midnight
// cron.schedule("0 0 * * *", async () => {
//   const today = getToday();

//   try {
//     // Get all students
//     const students = await Student.find({ isActive: true });

//     for (const student of students) {
//       // Check if attendance already marked for today
//       const alreadyMarked = await Attendance.findOne({
//         studentId: student._id,
//         date: today,
//       });

//       if (!alreadyMarked) {
//         await Attendance.create({
//           instituteId: student.instituteId,
//           studentId: student._id,
//           date: today,
//           status: "ABSENT",
//         });
//       }
//     }

//     console.log(`[Scheduler] Marked ABSENT for students with no attendance on ${today}`);
//   } catch (err) {
//     console.error("[Scheduler] Error marking ABSENT:", err);
//   }
// });

const cron = require("node-cron");
const Student = require("../students/student.model");
const Attendance = require("../attendance/attendance.model");

/**
 * Get today's date in local timezone (IST safe)
 * Returns YYYY-MM-DD
 */
function getTodayLocal() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  const localTime = new Date(now.getTime() - offsetMs);
  return localTime.toISOString().split("T")[0];
}

/**
 * Core logic:
 * - Find all active students
 * - Find students whose attendance is already marked for today
 * - Insert ABSENT for remaining students (bulk)
 */
async function markAbsentForDate(date) {
  // 1️⃣ Get all active students (minimal fields)
  const students = await Student.find({ isActive: true })
    .select("_id instituteId")
    .lean();

  if (!students.length) return 0;

  // 2️⃣ Get already-marked attendance for today
  const marked = await Attendance.find({ date })
    .select("studentId")
    .lean();

  const markedSet = new Set(marked.map((a) => String(a.studentId)));

  // 3️⃣ Prepare ABSENT records
  const absentees = students
    .filter((s) => !markedSet.has(String(s._id)))
    .map((s) => ({
      instituteId: s.instituteId,
      studentId: s._id,
      date,
      status: "ABSENT",
    }));

  // 4️⃣ Bulk insert (duplicate-safe because of unique index)
  if (absentees.length) {
    try {
      await Attendance.insertMany(absentees, { ordered: false });
    } catch (err) {
      // Ignore duplicate key errors safely
      if (err.code !== 11000) {
        throw err;
      }
    }
  }

  return absentees.length;
}

/**
 * CRON JOB
 * Runs daily at 12:00 AM IST
 */
cron.schedule(
  "0 0 * * *",
  async () => {
    const today = getTodayLocal();

    try {
      const count = await markAbsentForDate(today);
      console.log(
        `[Attendance Scheduler] ${count} students marked ABSENT for ${today}`
      );
    } catch (err) {
      console.error("[Attendance Scheduler] Error:", err);
    }
  },
  {
    timezone: "Asia/Kolkata",
  }
);

// Export for manual testing
module.exports = {
  markAbsentForDate,
};
