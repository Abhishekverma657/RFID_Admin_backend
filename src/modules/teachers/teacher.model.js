const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: true,
    },

    name: { type: String, required: true },
    employeeId: { type: String, required: true },

    email: { type: String },
    phone: { type: String },

    subjects: [{ type: String }], // later subjectId se link kar sakte
 

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Unique per institute
teacherSchema.index(
  { instituteId: 1, employeeId: 1 },
  { unique: true }
);

module.exports = mongoose.model("Teacher", teacherSchema);
