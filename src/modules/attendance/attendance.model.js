// const mongoose = require("mongoose");

// const attendanceSchema = new mongoose.Schema(
//   {
//     instituteId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Institute",
//       required: true,
//     },

//     studentId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Student",
//       required: true,
//     },

//     date: {
//       type: String, // YYYY-MM-DD
//       required: true,
//     },

//     firstInTime: { type: String },   // 09:05
//     lastScanTime: { type: String },  // 15:20

//     method: {
//       type: String,
//       enum: ["RFID", "FACE"],
//       required: true,
//     },

//     deviceId: { type: String },

//     status: {
//       type: String,
//       enum: ["PRESENT"],
//       default: "PRESENT",
//     },
//   },
//   { timestamps: true }
// );

// // 🔒 ONE attendance per student per day
// attendanceSchema.index(
//   { studentId: 1, date: 1 },
//   { unique: true }
// );

// module.exports = mongoose.model("Attendance", attendanceSchema);

const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    date: { type: String, required: true }, // YYYY-MM-DD

    firstInTime: String,
    lastOutTime: String,

    lastPunchTime: { type: String }, // 🔥 IMPORTANT
    lastPunchType: {
      type: String,
      enum: ["IN", "OUT"],
    },

    status: {
      type: String,
      enum: ["PRESENT", "ABSENT"],
      default: "ABSENT",
    },
  },
  { timestamps: true }
);

attendanceSchema.index(
  { studentId: 1, date: 1 },
  { unique: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);
