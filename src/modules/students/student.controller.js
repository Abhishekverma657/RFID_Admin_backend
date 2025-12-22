const fs = require("fs");
const importer = require("./student.import");
const Student = require("./student.model");

// exports.importExcel = async (req, res, next) => {
//   try {
//     if (!req.file) throw new Error("Excel file required");

//     const result = await importer.importStudents(
//       req.file.path,
//       req.user.instituteId
//     );

//     fs.unlinkSync(req.file.path); // cleanup

//     res.json({
//       success: true,
//       message: "Students imported successfully",
//       result,
//     });
//   } catch (err) {
//     next(err);
//   }
// };
exports.getStudents = async (req, res, next) => {
  try {
    const students = await Student.find({
      instituteId: req.user.instituteId,
      isActive: true,
    }).sort({ rollNo: 1 });

    res.json({
      success: true,
      data: students,
    });
  } catch (err) {
    next(err);
  }
};
exports.updateStudent = async (req, res, next) => {
  try {
    const editedstudent = await Student.findOneAndUpdate(
      {
        _id: req.params.id,
        instituteId: req.user.instituteId,
      },
      req.body,
      { new: true }
    );

    if (!editedstudent) throw new Error("Student not found");

    res.json({
      success: true,
      data: editedstudent,
    });
  } catch (err) {
    next(err);
  }
};
 // delete student controller
exports.deleteStudent = async (req, res, next) => {
  try {
    const deletedStudent = await Student.findOneAndUpdate(
      {
        _id: req.params.id,
        instituteId: req.user.instituteId,
      },
      { isActive: false },
      { new: true }
    );

    if (!deletedStudent) throw new Error("Student not found");

    res.json({
      success: true,
      data: deletedStudent,
    });
  } catch (err) {
    next(err);
  }
}
 // distable  students isactive field to false
 exports.disableStudent = async (req, res, next) => {
  try {
    const disabledStudent = await Student.findOneAndUpdate(
      {
        _id: req.params.id,
        instituteId: req.user.instituteId,
      },
      { isActive: false },
      { new: true }
    );

    if (!disabledStudent) throw new Error("Student not found");

    res.json({
      success: true,
      data: disabledStudent,
    });
  } catch (err) {
    next(err);
  }
}


 



exports.addStudent = async (req, res, next) => {
  try {
    const {
      rollNo,
      name,
      className,
      section,
      email,
      phone,
      rfidCardId,
      faceId,
    } = req.body;

    if (!rollNo || !name)
      throw new Error("RollNo and Name required");

    // Check for duplicate rollNo/class/section/institute
    const exists = await Student.findOne({
      instituteId: req.user.instituteId,
      rollNo,
      className,
      section,
    });
    if (exists) throw new Error("Student already exists");

    // Check for duplicate RFID
    if (rfidCardId) {
      const rfidExists = await Student.findOne({ rfidCardId });
      if (rfidExists) throw new Error("RFID already assigned to another student");
    }

    const student = await Student.create({
      instituteId: req.user.instituteId,
      rollNo,
      name,
      className,
      section,
      email,
      phone,
      rfidCardId,
      faceId,
    });

    res.status(201).json({
      success: true,
      data: student,
    });
  } catch (err) {
    next(err);
  }
};

exports.importStudents = async (req, res) => {
  try {
    const instituteId = req.user.instituteId;
    const { students } = req.body;
     console.log(instituteId, students);

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Students JSON required",
      });
    }

    const result = await importer.importStudentsFromJson(students, instituteId);

    res.json({
      success: true,
      message: "Import completed",
      ...result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Import failed",
    });
  }
};

