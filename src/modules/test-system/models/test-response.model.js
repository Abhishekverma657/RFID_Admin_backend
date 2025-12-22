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
            enum: ["manual", "auto-time", "auto-violation", "disconnect"],
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
    },
    { timestamps: true }
);

testResponseSchema.index({ testStudentId: 1, testId: 1 });
testResponseSchema.index({ status: 1 });

module.exports = mongoose.model("TestResponse", testResponseSchema);
