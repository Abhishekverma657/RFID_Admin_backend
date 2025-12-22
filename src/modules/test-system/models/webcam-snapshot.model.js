const mongoose = require("mongoose");

const webcamSnapshotSchema = new mongoose.Schema(
    {
        testResponseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TestResponse",
            required: true,
        },
        testStudentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TestStudent",
            required: true,
        },
        imageUrl: {
            type: String,
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

webcamSnapshotSchema.index({ testResponseId: 1, timestamp: 1 });

module.exports = mongoose.model("WebcamSnapshot", webcamSnapshotSchema);
