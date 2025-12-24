const mongoose = require("mongoose");

const testResponseSchema = new mongoose.Schema(
    {
        testStudentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TestStudent",
            required: true,
        },
        testId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Test",
            required: true,
        },
        startTime: {
            type: Date,
            default: Date.now,
        },
        endTime: {
            type: Date,
        },
        submitType: {
            type: String,
            enum: ["manual", "auto-time", "auto-violation", "disconnect", "admin-terminated"],
        },
        terminatedBy: {
            type: String, // Admin name or ID
        },
        terminationReason: {
            type: String,
        },
        answers: [
            {
                questionId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Question",
                },
                selectedOption: {
                    type: String,
                    enum: ["A", "B", "C", "D"],
                },
                timeSpent: {
                    type: Number, // in seconds
                    default: 0,
                },
                answeredAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        status: {
            type: String,
            enum: ["in-progress", "submitted"],
            default: "in-progress",
        },
        score: {
            type: Number,
            default: 0
        },
        scoreMetadata: {
            totalQuestions: { type: Number, default: 0 },
            attempted: { type: Number, default: 0 },
            correct: { type: Number, default: 0 },
            incorrect: { type: Number, default: 0 },
            unattempted: { type: Number, default: 0 },
        },
        resultPublished: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

testResponseSchema.index({ testStudentId: 1, testId: 1 });
testResponseSchema.index({ status: 1 });

module.exports = mongoose.model("TestResponse", testResponseSchema);
