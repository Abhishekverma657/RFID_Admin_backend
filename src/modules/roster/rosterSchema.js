const mongoose = require("mongoose");
const daySchema = require("./day.model");

const rosterSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: true,
    },

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    classTitle: {
      type: String,
      required: true, // "Class 10 - A"
    },

    // New Customization Fields
    sessionTitle: { type: String }, // "Morning DOUBT'S & SELF STUDY Sessions"
    roomNo: { type: String },       // "501"
    floorNo: { type: String },      // "5"
    batchName: { type: String },    // "Early Elevate - Batch A"

    academicFrom: {
      type: Date,
      required: true,
    },

    academicTo: {
      type: Date,
      required: true,
    },

    // Dynamic Columns definition
    timeSlots: [{
      label: { type: String }, // "10:10 AM - 11:00 AM"
      startTime: { type: String }, // "10:10"
      endTime: { type: String },   // "11:00"
      key: { type: String },       // "slot_12345"
    }],

    weekSchedule: [daySchema], // Mon–Sat table
  },
  { timestamps: true }
);

// rosterSchema.index({ instituteId: 1, classId: 1 }, { unique: true });

module.exports = mongoose.model("Roster", rosterSchema);
