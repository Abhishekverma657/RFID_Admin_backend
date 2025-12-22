const Subject = require("./subject.model");

exports.addSubject = async (req, res, next) => {
  try {
    if (!req.body.name)
      throw new Error("Subject name required");

    const subject = await Subject.create({
      instituteId: req.user.instituteId,
      name: req.body.name,
    });

    res.status(201).json({
      success: true,
      data: subject,
    });
  } catch (err) {
    next(err);
  }
};

exports.getSubjects = async (req, res, next) => {
  try {
    const subjects = await Subject.find({
      instituteId: req.user.instituteId,
      isActive: true,
    }).sort({ name: 1 });

    res.json({
      success: true,
      data: subjects,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findOneAndUpdate(
      {
        _id: req.params.id,
        instituteId: req.user.instituteId,
      },
      { isActive: false },
      { new: true }
    );

    if (!subject) throw new Error("Subject not found");

    res.json({
      success: true,
      message: "Subject deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};
