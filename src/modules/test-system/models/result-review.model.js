const mongoose = require("mongoose");

const resultReviewSchema = new mongoose.Schema(
    {
        testResponseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TestResponse",
            required: true,
            unique: true,
        },
        testStudentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TestStudent",
            required: true,
        },
        status: {
            type: String,
            enum: ["under-review", "valid", "disqualified", "published"],
            default: "under-review",
        },
        adminRemark: {
            type: String,
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        reviewedAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

resultReviewSchema.index({ testStudentId: 1 });
resultReviewSchema.index({ status: 1 });

module.exports = mongoose.model("ResultReview", resultReviewSchema);
