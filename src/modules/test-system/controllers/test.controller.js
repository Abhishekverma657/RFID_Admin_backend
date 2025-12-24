const Test = require("../models/test.model");

/**
 * Create a new test
 * POST /api/test-system/tests
 */
exports.createTest = async (req, res, next) => {
    try {
        const {
            instituteId, title, description, duration,
            targetClass, targetPaperSet, totalMarks, passingMarks,
            proctoringConfig, showResultsTo, violationRules, questionPaperId,
            startTime, endTime
        } = req.body;

        if (!instituteId || !title || !targetClass || !targetPaperSet) {
            return res.status(400).json({
                success: false,
                message: "instituteId, title, class, and paper set are required",
            });
        }

        // Calculate duration if startTime and endTime are provided
        let calcDuration = duration;
        if (startTime && endTime) {
            const start = new Date(startTime);
            const end = new Date(endTime);
            calcDuration = Math.floor((end - start) / (1000 * 60));
        }

        if (!calcDuration && !duration) {
            return res.status(400).json({
                success: false,
                message: "Duration or Start/End times are required",
            });
        }

        const test = await Test.create({
            instituteId,
            title,
            description,
            duration: calcDuration,
            targetClass,
            targetPaperSet,
            totalMarks,
            passingMarks,
            proctoringConfig,
            showResultsTo,
            violationRules,
            questionPaperId: questionPaperId || null,
            startTime,
            endTime
        });

        res.status(201).json({
            success: true,
            data: test,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all tests for an institute
 * GET /api/test-system/tests?instituteId=xxx
 */
exports.getTests = async (req, res, next) => {
    try {
        const { instituteId } = req.query;

        if (!instituteId) {
            return res.status(400).json({
                success: false,
                message: "instituteId is required",
            });
        }

        const mongoose = require("mongoose");
        const tests = await Test.aggregate([
            { $match: { instituteId: new mongoose.Types.ObjectId(instituteId) } },
            { $sort: { createdAt: -1 } },
            {
                $lookup: {
                    from: "questions",
                    let: { tClass: "$targetClass", tSet: "$targetPaperSet", tInst: "$instituteId" },
                    pipeline: [
                        {
                            $match:
                            {
                                $expr:
                                {
                                    $and:
                                        [
                                            { $eq: ["$class", "$$tClass"] },
                                            { $eq: ["$set", "$$tSet"] },
                                            { $eq: ["$instituteId", "$$tInst"] }
                                        ]
                                }
                            }
                        },
                        { $count: "count" }
                    ],
                    as: "questionData"
                }
            },
            {
                $addFields: {
                    questionCount: { $ifNull: [{ $arrayElemAt: ["$questionData.count", 0] }, 0] }
                }
            },
            { $project: { questionData: 0 } }
        ]);

        res.json({
            success: true,
            count: tests.length,
            data: tests,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get single test by ID
 * GET /api/test-system/tests/:id
 */
exports.getTestById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const test = await Test.findById(id);

        if (!test) {
            return res.status(404).json({
                success: false,
                message: "Test not found",
            });
        }

        res.json({
            success: true,
            data: test,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update test
 * PUT /api/test-system/tests/:id
 */
exports.updateTest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            title, description, duration,
            targetClass, targetPaperSet, totalMarks, passingMarks,
            proctoringConfig, showResultsTo, violationRules, isActive, questionPaperId,
            startTime, endTime
        } = req.body;

        // Calculate duration if startTime and endTime are provided
        let calcDuration = duration;
        if (startTime && endTime) {
            const start = new Date(startTime);
            const end = new Date(endTime);
            calcDuration = Math.floor((end - start) / (1000 * 60));
        }

        const test = await Test.findByIdAndUpdate(
            id,
            {
                title, description, duration: calcDuration,
                targetClass, targetPaperSet, totalMarks, passingMarks,
                proctoringConfig, showResultsTo, violationRules, isActive,
                questionPaperId: questionPaperId || null,
                startTime,
                endTime
            },
            { new: true, runValidators: true }
        );

        if (!test) {
            return res.status(404).json({
                success: false,
                message: "Test not found",
            });
        }

        res.json({
            success: true,
            data: test,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete test
 * DELETE /api/test-system/tests/:id
 */
exports.deleteTest = async (req, res, next) => {
    try {
        const { id } = req.params;

        const test = await Test.findByIdAndDelete(id);

        if (!test) {
            return res.status(404).json({
                success: false,
                message: "Test not found",
            });
        }

        res.json({
            success: true,
            message: "Test deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Generate test link
 * GET /api/test-system/tests/:id/link
 */
exports.getTestLink = async (req, res, next) => {
    try {
        const { id } = req.params;

        const test = await Test.findById(id);

        if (!test) {
            return res.status(404).json({
                success: false,
                message: "Test not found",
            });
        }

        // Generate link (frontend will handle the full URL)
        const testLink = `/test/${id}`;

        res.json({
            success: true,
            data: {
                testId: id,
                testTitle: test.title,
                testLink,
            },
        });
    } catch (error) {
        next(error);
    }
};
