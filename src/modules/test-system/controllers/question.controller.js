const Question = require("../models/question.model");
const { parseQuestionsExcel, areQuestionsImmutable } = require("../services/excel-parser.service");

/**
 * Import questions from Excel
 * POST /api/test-system/questions/import
 */
const QuestionPaper = require("../models/question-paper.model");

/**
 * Import questions from Excel
 * POST /api/test-system/questions/import
 */
exports.importQuestions = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Excel file is required",
            });
        }

        const { instituteId, paperTitle, className, paperSet } = req.body;

        if (!instituteId) {
            return res.status(400).json({
                success: false,
                message: "instituteId is required",
            });
        }

        // Validate required fields for the new flow
        if (!paperTitle || !className || !paperSet) {
            return res.status(400).json({
                success: false,
                message: "Paper Title, Class, and Set are required.",
            });
        }

        let questionPaperId = null;

        // Check if paper already exists or create new
        // We might want to allow appending to existing paper or strictly new?
        // User said "ek set ka question ka ek json bange", implying a new structure.
        // Let's create a new QuestionPaper entry for now as per previous logic.

        const paper = await QuestionPaper.create({
            instituteId,
            title: paperTitle,
            class: className,
            set: paperSet
        });
        questionPaperId = paper._id;

        // Parse Excel file
        // Pass className and paperSet to the parser
        const results = await parseQuestionsExcel(req.file.buffer, instituteId, questionPaperId, className, paperSet);

        // Update counts if paper created
        if (questionPaperId) {
            await QuestionPaper.findByIdAndUpdate(questionPaperId, {
                questionCount: results.success.length
            });
        }

        res.json({
            success: true,
            data: {
                imported: results.success.length,
                failed: results.errors.length,
                successDetails: results.success,
                errorDetails: results.errors,
                questionPaperId
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get question papers
 * GET /api/test-system/questions/papers?instituteId=xxx
 */
exports.getQuestionPapers = async (req, res, next) => {
    try {
        const { instituteId } = req.query;
        if (!instituteId) return res.status(400).json({ success: false, message: "instituteId required" });

        const papers = await QuestionPaper.find({ instituteId }).sort({ createdAt: -1 });
        res.json({ success: true, data: papers });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete question paper
 * DELETE /api/test-system/questions/papers/:id
 */
exports.deleteQuestionPaper = async (req, res, next) => {
    try {
        const { id } = req.params;
        // Delete paper record
        const paper = await QuestionPaper.findByIdAndDelete(id);
        if (!paper) return res.status(404).json({ success: false, message: "Paper not found" });

        // Delete associated questions
        await Question.deleteMany({ questionPaperId: id });

        res.json({ success: true, message: "Question Paper and its questions deleted" });
    } catch (error) {
        next(error);
    }
};

/**
 * Get questions with filters
 * GET /api/test-system/questions?instituteId=xxx&class=yyy&set=zzz
 */
exports.getQuestions = async (req, res, next) => {
    try {
        const { instituteId, class: className, set } = req.query;

        if (!instituteId) {
            return res.status(400).json({
                success: false,
                message: "instituteId is required",
            });
        }

        const filter = { instituteId };
        if (className) filter.class = className;
        if (set) filter.set = set;

        const questions = await Question.find(filter).sort({ class: 1, set: 1, sr: 1 });

        res.json({
            success: true,
            count: questions.length,
            data: questions,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a question
 * DELETE /api/test-system/questions/:id
 */
exports.deleteQuestion = async (req, res, next) => {
    try {
        const { id } = req.params;

        const question = await Question.findByIdAndDelete(id);

        if (!question) {
            return res.status(404).json({
                success: false,
                message: "Question not found",
            });
        }

        res.json({
            success: true,
            message: "Question deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Check if questions are immutable (used in active tests)
 * GET /api/test-system/questions/validate-immutable?instituteId=xxx&class=yyy&set=zzz
 */
exports.checkImmutable = async (req, res, next) => {
    try {
        const { instituteId, class: className, set } = req.query;

        if (!instituteId || !className || !set) {
            return res.status(400).json({
                success: false,
                message: "instituteId, class, and set are required",
            });
        }

        const isImmutable = await areQuestionsImmutable(instituteId, className, set);

        res.json({
            success: true,
            data: {
                isImmutable,
                message: isImmutable
                    ? "Questions are being used in active tests and cannot be modified"
                    : "Questions can be modified",
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update a question (Full Edit)
 * PUT /api/test-system/questions/:id
 */
exports.updateQuestion = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // If options are updated, ensure we handle the structure
        // The frontend should send the full new object

        const question = await Question.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!question) {
            return res.status(404).json({
                success: false,
                message: "Question not found",
            });
        }

        res.json({
            success: true,
            data: question,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Reorder questions
 * POST /api/test-system/questions/reorder
 * Body: { questionIds: ["id1", "id2", ...] }  // Ordered list
 */
exports.reorderQuestions = async (req, res, next) => {
    try {
        const { questionIds } = req.body;

        if (!questionIds || !Array.isArray(questionIds)) {
            return res.status(400).json({
                success: false,
                message: "questionIds array is required",
            });
        }

        // Bulk write to update SR
        const operations = questionIds.map((id, index) => ({
            updateOne: {
                filter: { _id: id },
                update: { $set: { sr: index + 1 } }
            }
        }));

        if (operations.length > 0) {
            await Question.bulkWrite(operations);
        }

        res.json({
            success: true,
            message: "Questions reordered successfully"
        });
    } catch (error) {
        next(error);
    }
};
/**
 * Create a new question manually
 * POST /api/test-system/questions
 */
exports.createQuestion = async (req, res, next) => {
    try {
        const {
            instituteId,
            questionPaperId,
            class: className,
            set,
            question,
            questionImage,
            level,
            options,
            correctOptionIndex,
            // Supporting legacy format if needed
            optionA, optionB, optionC, optionD, correctAnswer
        } = req.body;

        if (!instituteId || !questionPaperId) {
            return res.status(400).json({
                success: false,
                message: "instituteId and questionPaperId are required",
            });
        }

        // Get current max SR to assign next one
        const lastQuestion = await Question.findOne({ questionPaperId }).sort({ sr: -1 });
        const nextSr = lastQuestion ? lastQuestion.sr + 1 : 1;

        const newQuestion = await Question.create({
            instituteId,
            questionPaperId,
            class: className,
            set,
            sr: nextSr,
            question,
            questionImage,
            level: level || "Medium",
            options,
            correctOptionIndex,
            optionA, optionB, optionC, optionD, correctAnswer
        });

        // Update QuestionPaper count
        await QuestionPaper.findByIdAndUpdate(questionPaperId, {
            $inc: { questionCount: 1 }
        });

        res.status(201).json({
            success: true,
            data: newQuestion
        });
    } catch (error) {
        next(error);
    }
};
