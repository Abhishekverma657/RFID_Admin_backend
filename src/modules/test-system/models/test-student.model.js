const mongoose = require("mongoose");

const testStudentSchema = new mongoose.Schema(
    {
        instituteId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Institute",
            required: true,
        },
        userId: {
            type: String,
            required: true,
            unique: true,
        },
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        rollNumber: {
            type: String, // Optional
        },
        mobileNumber: {
            type: String, // Optional but recommended for updates
        },
        assignedTest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Test",
        },
        assignedClass: {
            type: String,
        },
        assignedPaperSet: {
            type: String,
            enum: ["A", "B", "C", "D"],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Index for fast lookups
testStudentSchema.index({ instituteId: 1, email: 1 });

module.exports = mongoose.model("TestStudent", testStudentSchema);
