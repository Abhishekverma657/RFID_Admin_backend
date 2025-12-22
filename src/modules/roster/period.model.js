const mongoose = require("mongoose");

const periodSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: false,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: false,
    },
    // If not using dynamic columns, we fall back to start/end strings.
    // Ideally these are just for display if we want overrides, 
    // but the main columns come from roster.timeSlots
    startTime: { type: String, required: false },
    endTime: { type: String, required: false },

    // We can also store periodIndex if we want strict mapping to columns
    periodIndex: { type: Number },
  }, { _id: false });

module.exports = periodSchema;
