const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: true,
    },
    name: {
      type: String, // Math, English
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

subjectSchema.index(
  { instituteId: 1, name: 1 },
  { unique: true }
);

module.exports = mongoose.model("Subject", subjectSchema);
