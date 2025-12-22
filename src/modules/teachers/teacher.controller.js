const fs = require("fs");
const importer = require("./teacher.import");
const Teacher = require("./teacher.model");

// Import Excel
exports.importExcel = async (req, res, next) => {
  try {
    if (!req.file) throw new Error("Excel file required");

    const result = await importer.importTeachers(
      req.file.path,
      req.user.instituteId
    );

    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      result,
    });
  } catch (err) {
    next(err);
  }
};

// Get list
exports.getTeachers = async (req, res, next) => {
  try {
    const teachers = await Teacher.find({
      instituteId: req.user.instituteId,
      // isActive: true,
    }).sort({ name: 1 });

    res.json({ success: true, data: teachers });
  } catch (err) {
    next(err);
  }
};

// Add manually
exports.addTeacher = async (req, res, next) => {
  try {
    const { employeeId, name, email, phone, subjects } = req.body;

    if (!employeeId || !name)
      throw new Error("EmployeeId and Name required");

    const exists = await Teacher.findOne({
      instituteId: req.user.instituteId,
      employeeId,
    });

    if (exists) throw new Error("Teacher already exists");

    const teacher = await Teacher.create({
      instituteId: req.user.instituteId,
      employeeId,
      name,
      email,
      phone,
      subjects,
    });

    res.status(201).json({ success: true, data: teacher });
  } catch (err) {
    next(err);
  }
};

// Update teacher
exports.updateTeacher = async (req, res, next) => {
  try {
    const teacher = await Teacher.findOneAndUpdate(
      {
        _id: req.params.id,
        instituteId: req.user.instituteId,
      },
      req.body,
      { new: true }
    );

    if (!teacher) throw new Error("Teacher not found");

    res.json({ success: true, data: teacher });
  } catch (err) {
    next(err);
  }
};

exports.importTeachers = async (req, res) => {
  try {
    const instituteId = req.user.instituteId;
    const { teachers } = req.body;

    if (!Array.isArray(teachers) || teachers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Teachers JSON required",
      });
    }

    const result = await importer.importTeachersFromJson(teachers, instituteId);

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

exports.deleteTeacher = async (req, res, next) => {
  try {
    const teacher = await Teacher.findOneAndUpdate(
      {
        _id: req.params.id,
        instituteId: req.user.instituteId,
      },
      { isActive: false },
      { new: true }
    );

    if (!teacher) throw new Error("Teacher not found");

    res.json({ success: true, message: "Teacher deleted", data: teacher });
  } catch (err) {
    next(err);
  }
};
