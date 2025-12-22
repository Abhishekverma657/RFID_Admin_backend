const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: true,
    },
    name: {
      type: String, // "10"
      required: true,
    },
    section: {
      type: String, // "A"
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// same institute me same class+section duplicate na ho
classSchema.index(
  { instituteId: 1, name: 1, section: 1 },
  { unique: true }
);

module.exports = mongoose.model("Class", classSchema);
