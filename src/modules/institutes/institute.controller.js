const service = require("./institute.service");

exports.createInstitute = async (req, res, next) => {
  try {
    const result = await service.createInstitute(req.body);

    res.status(201).json({
      success: true,
      institute: result.institute,
      adminCredentials: result.adminCredentials,
    });
  } catch (err) {
    next(err);
  }
};
 
exports.getInstitutes = async (req, res, next) => { 
  try {
    const institutes = await service.getInstitutes();
    res.status(200).json({ success: true, institutes });
  } catch (err) {
    next(err);
  }
};

exports.getInstitutesWithCounts = async (req, res, next) => {
  try {
    const institutes = await service.getInstitutesWithCounts();
    res.status(200).json({ success: true, institutes });
  } catch (err) {
    next(err);
  }
};

exports.getInstituteDetails = async (req, res, next) => {
  try {
    const details = await service.getInstituteDetails(req.params.id);
    res.status(200).json({ success: true, institute: details });
  } catch (err) {
    next(err);
  }
};

exports.getInstituteStats = async (req, res, next) => {
  try {
    const stats = await service.getInstituteStats(req.params.id);
    res.status(200).json({ success: true, stats });
  } catch (err) {
    next(err);
  }
};
