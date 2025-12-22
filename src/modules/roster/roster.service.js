// const Roster = require("./roster.model");

// exports.createOrUpdateRoster = async ({
//   instituteId,
//   classId,
//   classTitle,
//   periods,
// }) => {
//   if (!classId || !periods?.length)
//     throw new Error("Class and periods required");

//   const roster = await Roster.findOneAndUpdate(
//     { instituteId, classId },
//     {
//       instituteId,
//       classId,
//       classTitle,
//       periods,
//     },
//     { upsert: true, new: true }
//   );

//   return roster;
// };

// exports.getRosterByClass = async (instituteId, classId) => {
//   const roster = await Roster.findOne({
//     instituteId,
//     classId,
//   })
//     .populate("periods.subjectId", "name")
//     .populate("periods.teacherId", "name");

//   return roster;
// };
const Roster = require('./rosterSchema');



exports.createOrUpdateRoster = async ({
  _id, // Passed from controller if updating existing non-draft
  instituteId,
  classId,
  classTitle,
  sessionTitle,
  roomNo,
  floorNo,
  batchName,
  timeSlots,
  academicFrom,
  academicTo,
  weekSchedule,
}) => {
  if (!classId || !weekSchedule?.length)
    throw new Error("Class and weekly schedule required");

  // If _id is provided (and not a "DRAFT_" string which frontend strips ideally, but checked here just in case)
  // We update the existing roster
  if (_id && !String(_id).startsWith("DRAFT")) {
    return await Roster.findOneAndUpdate(
      { _id, instituteId },
      {
        classId,
        classTitle,
        sessionTitle,
        roomNo,
        floorNo,
        batchName,
        timeSlots,
        academicFrom,
        academicTo,
        weekSchedule,
      },
      { new: true }
    );
  }

  // Otherwise create a NEW roster (even if one exists for this class)
  return await Roster.create({
    instituteId,
    classId,
    classTitle,
    sessionTitle,
    roomNo,
    floorNo,
    batchName,
    timeSlots,
    academicFrom,
    academicTo,
    weekSchedule,
  });
};

exports.getRosterByClass = async (instituteId, classId) => {
  return await Roster.findOne({ instituteId, classId })
    .populate("weekSchedule.periods.subjectId", "name")
    .populate("weekSchedule.periods.teacherId", "name");
};

exports.getAllRosters = async (instituteId) => {
  return await Roster.find({ instituteId })
    .populate("classId", "name section")
    .populate("weekSchedule.periods.subjectId", "name")
    .populate("weekSchedule.periods.teacherId", "name")
    .sort({ createdAt: -1 });
};

exports.deleteRoster = async (instituteId, rosterId) => {
  return await Roster.findOneAndDelete({ _id: rosterId, instituteId });
};
