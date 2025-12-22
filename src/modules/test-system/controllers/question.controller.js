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

        let questionPaperId = null;

        // If paper title is provided, create a Question Paper container
        if (paperTitle && className && paperSet) {
            const paper = await QuestionPaper.create({
                instituteId,
                title: paperTitle,
                class: className,
                set: paperSet
            });
            questionPaperId = paper._id;
        }

        // Parse Excel file
        const results = await parseQuestionsExcel(req.file.buffer, instituteId, questionPaperId);

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
