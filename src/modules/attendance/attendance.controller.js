const service = require("./attendance.service");
const Attendance = require("./attendance.model");
const Student = require("../students/student.model");
const { default: mongoose } = require("mongoose");

 

exports.markFace = async (req, res, next) => {
  try {
    const { faceId, time, deviceId } = req.body;

    const data = await service.markDailyAttendance({
      instituteId: req.user.instituteId,
      identifier: faceId,
      method: "FACE",
      time,
      deviceId,
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.markRFID = async (req, res, next) => {
  try {
    const { rfid, time } = req.body;

    const result = await service.punchAttendance({
      instituteId: req.user.instituteId,
      identifier: rfid,
      method: "RFID",
      time,
    });

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};
 
exports.getInstituteAttendance = async (req, res, next) => {
  try {
    const { instituteId } = req.params;

    if (req.user.instituteId.toString() !== instituteId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    const today = new Date().toISOString().split("T")[0];
    const instId = new mongoose.Types.ObjectId(instituteId);
    const data = await Student.aggregate([
  {
    $match: {
      instituteId: instId,
      isActive: true,
    },
  },
  {
    $lookup: {
      from: "attendances",
      localField: "_id",
      foreignField: "studentId",
      as: "attendance",
    },
  },
  { $unwind: { path: "$attendance", preserveNullAndEmptyArrays: true } },
  {
    $project: {
      _id: {
        $ifNull: ["$attendance._id", "$_id"],
      },
      date: "$attendance.date",
      status: {
        $ifNull: ["$attendance.status", "NOT MARKED"],
      },
      firstInTime: "$attendance.firstInTime",
      lastOutTime: "$attendance.lastOutTime",
      createdAt: "$attendance.createdAt",

      student: {
        _id: "$_id",
        name: "$name",
        rollNo: "$rollNo",
        className: "$className",
        section: "$section",
      },
    },
  },
  { $sort: { date: -1, "student.rollNo": 1 } },
]);

 
    

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

 
 

exports.getStudentAttendance = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const data = await Student.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(studentId),
        },
      },
      {
        // 🔒 institute security
        $match: {
          instituteId: new mongoose.Types.ObjectId(req.user.instituteId),
        },
      },
      {
        $lookup: {
          from: "attendances",
          localField: "_id",
          foreignField: "studentId",
          as: "attendance",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          rollNo: 1,
          className: 1,
          section: 1,
          email: 1,
          phone: 1,
          rfidCardId: 1,
          faceId: 1,

          attendance: {
            $map: {
              input: "$attendance",
              as: "a",
              in: {
                _id: "$$a._id",
                date: "$$a.date",
                status: "$$a.status",
                firstInTime: "$$a.firstInTime",
                lastOutTime: "$$a.lastOutTime",
                createdAt: "$$a.createdAt",
              },
            },
          },
        },
      },
    ]);

    if (!data.length) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.json({
      success: true,
      data: data[0],
    });
  } catch (err) {
    next(err);
  }
};


// exports.getAllStudentsAttendanceToday = async (req, res, next) => {
//   try {
//     const { instituteId } = req.params;
//     if (req.user.instituteId.toString() !== instituteId) {
//       return res.status(403).json({ success: false, message: "Forbidden" });
//     }

//     const today = new Date().toISOString().split("T")[0];

//     // Get all students of the institute
//     const students = await Student.find({ instituteId });

//     // Get all today's attendance records for the institute
//     const attendanceRecords = await Attendance.find({ instituteId, date: today });

//     // Map studentId to attendance status
//     const attendanceMap = {};
//     attendanceRecords.forEach((rec) => {
//       attendanceMap[rec.studentId.toString()] = rec.status || "PRESENT";
//     });

//     // Prepare result: all students with their status
//     const result = students.map((student) => ({
//       _id: student._id,
//       name: student.name,
//       rollNo: student.rollNo,
//       className: student.className,
//       section: student.section,
//       status: attendanceMap[student._id.toString()] || "ABSENT",
//     }));

//     res.json({ success: true, data: result });
//   } catch (err) {
//     next(err);
//   }
// };
