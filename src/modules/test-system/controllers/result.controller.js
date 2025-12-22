const TestResponse = require("../models/test-response.model");
const Question = require("../models/question.model");
const ProctoringLog = require("../models/proctoring-log.model");
const WebcamSnapshot = require("../models/webcam-snapshot.model");
const ResultReview = require("../models/result-review.model");
const TestStudent = require("../models/test-student.model");
const Test = require("../models/test.model");

/**
 * Get all results for an institute
 * GET /api/test-system/results?instituteId=xxx
 */
exports.getAllResults = async (req, res, next) => {
    try {
        const { instituteId } = req.query;

        if (!instituteId) {
            return res.status(400).json({
                success: false,
                message: "instituteId is required",
            });
        }

        // Get all test students for this institute
        const testStudents = await TestStudent.find({ instituteId });
        const testStudentIds = testStudents.map((s) => s._id);

        // Get all test responses
        const testResponses = await TestResponse.find({
            testStudentId: { $in: testStudentIds },
            status: "submitted",
        })
            .populate("testStudentId", "userId name email assignedClass assignedPaperSet")
            .populate("testId", "title duration")
            .sort({ createdAt: -1 });

        // Get review status for each response
        const results = await Promise.all(
            testResponses.map(async (response) => {
                const review = await ResultReview.findOne({ testResponseId: response._id });

                return {
                    id: response._id,
                    student: response.testStudentId,
                    test: response.testId,
                    startTime: response.startTime,
                    endTime: response.endTime,
                    submitType: response.submitType,
                    answeredCount: response.answers.length,
                    reviewStatus: review ? review.status : "under-review",
                };
            })
        );

        res.json({
            success: true,
            count: results.length,
            data: results,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get detailed result for a specific test response
 * GET /api/test-system/results/:id/detail
 */
exports.getResultDetail = async (req, res, next) => {
    try {
        const { id } = req.params;

        const testResponse = await TestResponse.findById(id)
            .populate("testStudentId")
            .populate("testId");

        if (!testResponse) {
            return res.status(404).json({
                success: false,
                message: "Test response not found",
            });
        }

        // Get all questions for this test
        const student = testResponse.testStudentId;
        const questions = await Question.find({
            instituteId: student.instituteId,
            class: student.assignedClass,
            set: student.assignedPaperSet,
        }).sort({ sr: 1 });

        // Calculate performance
        let correct = 0;
        let wrong = 0;
        let unattempted = questions.length - testResponse.answers.length;

        const questionWiseBreakdown = questions.map((q) => {
            const answer = testResponse.answers.find(
                (ans) => ans.questionId.toString() === q._id.toString()
            );

            let isCorrect = null;
            if (answer && q.isEvaluatable) {
                isCorrect = answer.selectedOption === q.correctAnswer;
                if (isCorrect) correct++;
                else wrong++;
            }

            return {
                sr: q.sr,
                question: q.question,
                optionA: q.optionA,
                optionB: q.optionB,
                optionC: q.optionC,
                optionD: q.optionD,
                correctAnswer: q.correctAnswer,
                selectedOption: answer ? answer.selectedOption : null,
                timeSpent: answer ? answer.timeSpent : 0,
                isCorrect,
                isEvaluatable: q.isEvaluatable,
            };
        });

        // Get violations
        const violations = await ProctoringLog.find({
            testResponseId: id,
        }).sort({ timestamp: 1 });

        // Get webcam snapshots
        const snapshots = await WebcamSnapshot.find({
            testResponseId: id,
        }).sort({ timestamp: 1 });

        // Get review status
        const review = await ResultReview.findOne({ testResponseId: id });

        res.json({
            success: true,
            data: {
                examSummary: {
                    testTitle: testResponse.testId.title,
                    studentName: student.name,
                    userId: student.userId,
                    startTime: testResponse.startTime,
                    endTime: testResponse.endTime,
                    submitType: testResponse.submitType,
                    duration: testResponse.testId.duration,
                },
                performanceSummary: {
                    totalQuestions: questions.length,
                    attempted: testResponse.answers.length,
                    unattempted,
                    correct,
                    wrong,
                    score: correct,
                },
                questionWiseBreakdown,
                violations: violations.map((v) => ({
                    type: v.violationType,
                    timestamp: v.timestamp,
                    metadata: v.metadata,
                })),
                snapshots: snapshots.map((s) => ({
                    imageUrl: s.imageUrl,
                    timestamp: s.timestamp,
                })),
                review: review
                    ? {
                        status: review.status,
                        adminRemark: review.adminRemark,
                        reviewedAt: review.reviewedAt,
                    }
                    : null,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update review status
 * PUT /api/test-system/results/:id/review
 */
exports.updateReviewStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, adminRemark, reviewedBy } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "status is required",
            });
        }

        const testResponse = await TestResponse.findById(id);

        if (!testResponse) {
            return res.status(404).json({
                success: false,
                message: "Test response not found",
            });
        }

        // Update or create review
        let review = await ResultReview.findOne({ testResponseId: id });

        if (review) {
            review.status = status;
            review.adminRemark = adminRemark;
            review.reviewedBy = reviewedBy;
            review.reviewedAt = new Date();
            await review.save();
        } else {
            review = await ResultReview.create({
                testResponseId: id,
                testStudentId: testResponse.testStudentId,
                status,
                adminRemark,
                reviewedBy,
                reviewedAt: new Date(),
            });
        }

        res.json({
            success: true,
            data: review,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get student's own result (limited view)
 * GET /api/test-system/results/my-result
 */
exports.getMyResult = async (req, res, next) => {
    try {
        const { testStudentId } = req.testStudent;

        const testResponse = await TestResponse.findOne({
            testStudentId,
            status: "submitted",
        })
            .populate("testId")
            .sort({ createdAt: -1 });

        if (!testResponse) {
            return res.status(404).json({
                success: false,
                message: "No submitted test found",
            });
        }

        const test = testResponse.testId;
        const review = await ResultReview.findOne({ testResponseId: testResponse._id });

        // Get questions to calculate score (if test allows)
        const student = await TestStudent.findById(testStudentId);
        const questions = await Question.find({
            instituteId: student.instituteId,
            class: student.assignedClass,
            set: student.assignedPaperSet,
        });

        let correct = 0;
        testResponse.answers.forEach((answer) => {
            const question = questions.find((q) => q._id.toString() === answer.questionId.toString());
            if (question && question.isEvaluatable && answer.selectedOption === question.correctAnswer) {
                correct++;
            }
        });

        // Prepare response based on test configuration
        const result = {
            testTitle: test.title,
            submitType: testResponse.submitType,
            reviewStatus: review ? review.status : "under-review",
        };

        if (test.showResultsTo.score) {
            result.score = correct;
        }

        if (test.showResultsTo.attemptedCount) {
            result.attempted = testResponse.answers.length;
            result.unattempted = questions.length - testResponse.answers.length;
        }

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};
