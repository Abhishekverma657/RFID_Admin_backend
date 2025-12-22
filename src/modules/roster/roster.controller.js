// const service = require("./roster.service");

// // CREATE / UPDATE roster
// exports.saveRoster = async (req, res, next) => {
//   try {
//     const roster = await service.createOrUpdateRoster({
//       instituteId: req.user.instituteId,
//       classId: req.body.classId,
//       classTitle: req.body.classTitle,
//       periods: req.body.periods,
//     });

//     res.json({
//       success: true,
//       message: "Class roster saved",
//       data: roster,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// // GET roster by class
// exports.getRoster = async (req, res, next) => {
//   try {
//     const roster = await service.getRosterByClass(
//       req.user.instituteId,
//       req.params.classId
//     );

//     if (!roster) throw new Error("Roster not found");

//     res.json({ success: true, data: roster });
//   } catch (err) {
//     next(err);
//   }
// };
const service = require("./roster.service");

exports.saveRoster = async (req, res, next) => {
  try {
    const roster = await service.createOrUpdateRoster({
      _id: req.body._id, // Pass _id if present (for updates)
      instituteId: req.user.instituteId,
      classId: req.body.classId,
      classTitle: req.body.classTitle,

      // New fields
      sessionTitle: req.body.sessionTitle,
      roomNo: req.body.roomNo,
      floorNo: req.body.floorNo,
      batchName: req.body.batchName,
      timeSlots: req.body.timeSlots,

      academicFrom: req.body.academicFrom,
      academicTo: req.body.academicTo,
      weekSchedule: req.body.weekSchedule,
    });

    res.json({
      success: true,
      message: "Academic roster saved",
      data: roster,
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllRosters = async (req, res, next) => {
  try {
    const rosters = await service.getAllRosters(req.user.instituteId);
    res.json({ success: true, data: rosters });
  } catch (err) {
    next(err);
  }
};

exports.deleteRoster = async (req, res, next) => {
  try {
    await service.deleteRoster(req.user.instituteId, req.params.id);
    res.json({ success: true, message: "Roster deleted" });
  } catch (err) {
    next(err);
  }
};
