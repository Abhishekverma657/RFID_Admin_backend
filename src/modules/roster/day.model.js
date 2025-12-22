const mongoose = require("mongoose");
const periodSchema = require("./period.model");

const daySchema = new mongoose.Schema(
  {
    date: {
      type: String, // "2025-12-22"
    },
    day: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], // Matching frontend usually full names or keeping MON/TUE? Frontend has "Monday".
      required: true,
    },
    periods: [periodSchema],
  },
  { _id: false }
);

module.exports = daySchema;
