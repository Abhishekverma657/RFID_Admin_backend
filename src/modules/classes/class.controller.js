const ClassModel = require("./class.model");

exports.addClass = async (req, res, next) => {
  try {
    const { name, section } = req.body;

    if (!name || !section)
      throw new Error("Class name and section required");
    const existingClass = await ClassModel.findOne({
      instituteId: req.user.instituteId,
      name,
      section,
      isActive: true,
    });
    if (existingClass)
      throw new Error("Class with the same name and section already exists");

    const cls = await ClassModel.create({
      instituteId: req.user.instituteId,
      name,
      section,
    });

    res.status(201).json({
      success: true,
      data: cls,
    });
  } catch (err) {
    next(err);
  }
};

exports.getClasses = async (req, res, next) => {
  try {
    const classes = await ClassModel.find({
      instituteId: req.user.instituteId,
      isActive: true,
    }).sort({ name: 1, section: 1 });

    res.json({
      success: true,
      data: classes,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteClass = async (req, res, next) => {
  try {
    const cls = await ClassModel.findOneAndUpdate(
      {
        _id: req.params.id,
        instituteId: req.user.instituteId,
      },
      { isActive: false },
      { new: true }
    );

    if (!cls) throw new Error("Class not found");

    res.json({
      success: true,
      message: "Class deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};
