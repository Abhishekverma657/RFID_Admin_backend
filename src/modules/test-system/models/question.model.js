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
            required: false,
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
        questionImage: {
            type: String, // URL to image
            default: null
        },
        questionType: {
            type: String,
            enum: ["MCQ", "TEXT"], // Future proofing
            default: "MCQ"
        },
        level: {
            type: String,
            enum: ["Easy", "Medium", "Hard"],
            default: "Medium"
        },
        // Old structure support (deprecated but kept for backward compatibility if needed temporarily)
        optionA: { type: String },
        optionB: { type: String },
        optionC: { type: String },
        optionD: { type: String },

        // New structure
        options: [{
            text: { type: String },
            image: { type: String, default: null }, // URL to image
            id: { type: String } // '0', '1', '2' or unique ID
        }],

        correctAnswer: {
            type: String, // Storing index '0', '1' or 'A', 'B' for backward compatibility
            default: null,
        },
        correctOptionIndex: {
            type: Number, // 0, 1, 2, 3
            default: null
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
