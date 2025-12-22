const mongoose = require("mongoose");

const questionPaperSchema = new mongoose.Schema(
    {
        instituteId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Institute",
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        class: {
            type: String,
            required: true,
        },
        set: {
            type: String,
            required: true,
            enum: ["A", "B", "C", "D"],
        },
        description: {
            type: String,
        },
        questionCount: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("QuestionPaper", questionPaperSchema);
