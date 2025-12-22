// const Attendance = require("./attendance.model");
// const Student = require("../students/student.model");

// const today = () =>
//   new Date().toISOString().split("T")[0];

// exports.markDailyAttendance = async ({
//   instituteId,
//   identifier,
//   method,
//   time,
//   deviceId,
// }) => {
//   // 1. Identify student
//   const student =
//     method === "RFID"
//       ? await Student.findOne({ rfidCardId: identifier })
//       : await Student.findOne({ faceId: identifier });

//   if (!student) throw new Error("Student not found");

//   // 2. Check if already present today
//   const existing = await Attendance.findOne({
//     studentId: student._id,
//     date: today(),
//   });

//   // 3. If exists → just update last scan
//   if (existing) {
//     existing.lastScanTime = time;
//     await existing.save();
//     return existing;
//   }

//   // 4. Else → mark present
//   const attendance = await Attendance.create({
//     instituteId,
//     studentId: student._id,
//     date: today(),
//     firstInTime: time,
//     lastScanTime: time,
//     method,
//     deviceId,
//   });

//   return attendance;
// };

const Attendance = require("./attendance.model");
const Student = require("../students/student.model");
const { diffMinutes } = require("./attendance.utils");

const today = () =>
  new Date().toISOString().split("T")[0];

exports.punchAttendance = async ({
  instituteId,
  identifier,
  method,
  time,
}) => {
  // 1️⃣ Identify student
  const student =
    method === "RFID"
      ? await Student.findOne({ rfidCardId: identifier })
      : await Student.findOne({ faceId: identifier });

  if (!student) throw new Error("Student not found");

  // 🚫 Institute check
  if (student.instituteId.toString() !== instituteId.toString()) {
    throw new Error("Student does not belong to this institute");
  }

  // 2️⃣ Fetch today's attendance
  let attendance = await Attendance.findOne({
    studentId: student._id,
    date: today(),
  });

  // 3️⃣ First punch → CHECK-IN
  if (!attendance) {
    attendance = await Attendance.create({
      instituteId,
      studentId: student._id,
      date: today(),
      firstInTime: time,
      lastPunchTime: time,
      lastPunchType: "IN",
    });

    return {
      message: "Checked in successfully",
      type: "IN",
      student, // add student info
    };
  }

  // 4️⃣ If last punch was IN → possible OUT
  if (attendance.lastPunchType === "IN") {
    const mins = diffMinutes(attendance.lastPunchTime, time);

    // ❌ IN → IN not allowed within 1 hour
    if (mins < 60) {
      return {
        message: `Already checked in. Please wait ${60 - mins} minutes`,
        waitMinutes: 60 - mins,
        type: "IN",
        student, // add student info
      };
    }

    // ✅ After 1 hour → CHECK-OUT
    attendance.lastOutTime = time;
    attendance.lastPunchType = "OUT";
    attendance.lastPunchTime = time;
    await attendance.save();

    return {
      message: "Checked out successfully",
      type: "OUT",
      student, // add student info
    };
  }

  // 5️⃣ If last punch was OUT → CHECK-IN (NO WAIT)
  if (attendance.lastPunchType === "OUT") {
    attendance.lastPunchType = "IN";
    attendance.lastPunchTime = time;
    await attendance.save();

    return {
      message: "Checked in successfully",
      type: "IN",
      student, // add student info
    };
  }
};
