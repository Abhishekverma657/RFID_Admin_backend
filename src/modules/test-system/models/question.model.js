const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
    {
        instituteId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Institute",
            required: true,
        },
        questionPaperId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "QuestionPaper",
            required: false, // Optional for backward compatibility or direct addition
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
        sr: {
            type: Number,
            required: true,
        },
        question: {
            type: String,
            required: true,
        },
        optionA: {
            type: String,
            required: true,
        },
        optionB: {
            type: String,
            required: true,
        },
        optionC: {
            type: String,
            required: true,
        },
        optionD: {
            type: String,
            required: true,
        },
        correctAnswer: {
            type: String,
            enum: ["A", "B", "C", "D", null],
            default: null,
        },
        isEvaluatable: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Prevent duplicate questions within the same paper
questionSchema.index(
    { questionPaperId: 1, sr: 1 },
    { unique: true, sparse: true }
);

// Optional: Keep old index as non-unique or remove?
// Removing global unique on class/set/sr to allow multiple papers for same class
// questionSchema.index({ instituteId: 1, class: 1, set: 1, sr: 1 });

// Pre-save hook to set isEvaluatable based on correctAnswer
// Pre-save hook to set isEvaluatable based on correctAnswer
questionSchema.pre("save", async function () {
    if (!this.correctAnswer) {
        this.isEvaluatable = false;
    }
});

module.exports = mongoose.model("Question", questionSchema);
