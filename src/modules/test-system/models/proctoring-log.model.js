const mongoose = require("mongoose");

const proctoringLogSchema = new mongoose.Schema(
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
        violationType: {
            type: String,
            enum: [
                "TAB_SWITCH",
                "CAMERA_OFF",
                "AUDIO_NOISE",
                "FULLSCREEN_EXIT",
                "WINDOW_BLUR",
            ],
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
        },
    },
    { timestamps: true }
);

proctoringLogSchema.index({ testResponseId: 1, timestamp: 1 });
proctoringLogSchema.index({ testStudentId: 1 });

module.exports = mongoose.model("ProctoringLog", proctoringLogSchema);
