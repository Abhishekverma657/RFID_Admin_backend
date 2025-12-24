const TestResponse = require("../models/test-response.model");
const Question = require("../models/question.model");
const ProctoringLog = require("../models/proctoring-log.model");
const WebcamSnapshot = require("../models/webcam-snapshot.model");
const ResultReview = require("../models/result-review.model");
const TestStudent = require("../models/test-student.model");
const Test = require("../models/test.model");
const emailService = require("../services/email.service");

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

                // Get violation count for this response
                const violationCount = await ProctoringLog.countDocuments({ testResponseId: response._id });

                return {
                    id: response._id,
                    student: response.testStudentId,
                    test: response.testId,
                    startTime: response.startTime,
                    endTime: response.endTime,
                    submitType: response.submitType,
                    answeredCount: response.answers.length,
                    violationCount,
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
                    score: testResponse.score || ((correct * (testResponse.testId.markingScheme?.correct || 4)) + (wrong * (testResponse.testId.markingScheme?.incorrect || -1)) + (unattempted * (testResponse.testId.markingScheme?.unattempted || 0))),
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

        // Send Email if status is published
        if (status === "published" && !testResponse.resultPublished) {
            console.log(`[ResultEmail] Attempting to send result for TestResponseID: ${id}`);
            try {
                const fullResponse = await TestResponse.findById(id)
                    .populate("testStudentId")
                    .populate({
                        path: "testId",
                        select: "title duration markingScheme totalMarks passingMarks"
                    });

                if (!fullResponse || !fullResponse.testStudentId || !fullResponse.testId) {
                    throw new Error("Missing student or test information for email notification");
                }

                const student = fullResponse.testStudentId;
                const test = fullResponse.testId;

                console.log(`[ResultEmail] Calculating score for student: ${student.email}`);

                // Get questions for score calculation or metadata
                const questions = await Question.find({
                    instituteId: student.instituteId,
                    class: student.assignedClass,
                    set: student.assignedPaperSet,
                });

                if (!questions.length) {
                    console.warn(`[ResultEmail] No questions found for class ${student.assignedClass} set ${student.assignedPaperSet}`);
                }

                let correct = 0;
                let incorrect = 0;
                fullResponse.answers.forEach((answer) => {
                    const question = questions.find((q) => q._id.toString() === answer.questionId.toString());
                    if (question && question.isEvaluatable) {
                        if (answer.selectedOption === question.correctAnswer) {
                            correct++;
                        } else {
                            incorrect++;
                        }
                    }
                });

                const unattempted = questions.length - fullResponse.answers.length;
                const scheme = test.markingScheme || { correct: 4, incorrect: -1, unattempted: 0 };

                // Use stored score if available, otherwise calculate
                const score = (typeof fullResponse.score === 'number')
                    ? fullResponse.score
                    : (correct * scheme.correct) + (incorrect * scheme.incorrect) + (unattempted * scheme.unattempted);

                const accuracy = fullResponse.answers.length > 0
                    ? ((correct / fullResponse.answers.length) * 100).toFixed(1)
                    : 0;

                const resultData = {
                    score,
                    correct,
                    incorrect,
                    unattempted,
                    accuracy
                };

                console.log(`[ResultEmail] Sending notification... Status: ${status}, Score: ${score}`);
                await emailService.sendResultNotification(student, test, resultData);

                // Update flag to avoid duplicate emails
                testResponse.resultPublished = true;
                await testResponse.save();
                console.log(`[ResultEmail] Success: Email sent and flag updated for ${student.email}`);

            } catch (emailErr) {
                console.error("[ResultEmail] CRITICAL FAILURE:", emailErr.message);
                console.error(emailErr.stack);
            }
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
        let incorrect = 0;
        testResponse.answers.forEach((answer) => {
            const question = questions.find((q) => q._id.toString() === answer.questionId.toString());
            if (question && question.isEvaluatable) {
                if (answer.selectedOption === question.correctAnswer) {
                    correct++;
                } else {
                    incorrect++;
                }
            }
        });

        // Prepare response based on test configuration
        const result = {
            testTitle: test.title,
            submitType: testResponse.submitType,
            reviewStatus: review ? review.status : "under-review",
        };

        if (test.showResultsTo.score) {
            const unattempted = questions.length - testResponse.answers.length;
            const scheme = test.markingScheme || { correct: 4, incorrect: -1, unattempted: 0 };
            result.score = (correct * scheme.correct) + (incorrect * scheme.incorrect) + (unattempted * scheme.unattempted);
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
