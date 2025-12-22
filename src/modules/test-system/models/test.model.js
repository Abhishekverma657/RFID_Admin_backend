const mongoose = require("mongoose");

const testSchema = new mongoose.Schema(
    {
        instituteId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Institute",
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        duration: {
            type: Number, // in minutes
            required: true,
        },
        targetClass: {
            type: String,
            required: true, // Required for linking questions
        },
        targetPaperSet: {
            type: String,
            required: true, // e.g. "A", "B"
        },
        questionPaperId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "QuestionPaper",
        },
        totalMarks: {
            type: Number,
            required: true,
        },
        passingMarks: {
            type: Number,
            required: true,
        },
        showResultsTo: {
            score: { type: Boolean, default: true },
            attemptedCount: { type: Boolean, default: true },
            correctAnswers: { type: Boolean, default: false },
            questions: { type: Boolean, default: false },
        },
        proctoringConfig: {
            webcamRequired: { type: Boolean, default: true },
            fullScreenEnforced: { type: Boolean, default: true },
            tabSwitchLimit: { type: Number, default: 3 },
            violationLimit: { type: Number, default: 5 },
            deviceRestriction: { type: String, default: "any" },
        },
        violationRules: {
            TAB_SWITCH: { type: Number, default: 1 }, // weight or limit? usually limit is in config
            CAMERA_OFF: { type: Number, default: 10 }, // seconds tolerance
            AUDIO_NOISE: { type: Number, default: 5 }, // seconds tolerance
            FULLSCREEN_EXIT: { type: Number, default: 1 }, // weight
            WINDOW_BLUR: { type: Number, default: 1 }, // weight
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

testSchema.index({ instituteId: 1, isActive: 1 });

module.exports = mongoose.model("Test", testSchema);
