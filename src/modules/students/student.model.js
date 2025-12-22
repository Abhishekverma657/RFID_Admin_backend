const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: true,
    },

    rollNo: { type: String, required: true },
    name: { type: String, required: true },

    className: { type: String },
    section: { type: String },

    email: { type: String },
    phone: { type: String },

    rfidCardId: { type: String },
    faceId: { type: String },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Prevent duplicates per institute
studentSchema.index({ instituteId: 1, rollNo: 1, className: 1, section: 1 }, { unique: true });
studentSchema.index({ rfidCardId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Student", studentSchema);
