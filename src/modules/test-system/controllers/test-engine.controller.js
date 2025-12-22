const TestResponse = require("../models/test-response.model");
const Test = require("../models/test.model");
const Question = require("../models/question.model");
const ProctoringLog = require("../models/proctoring-log.model");
const WebcamSnapshot = require("../models/webcam-snapshot.model");
const TestStudent = require("../models/test-student.model");
const { saveSnapshot } = require("../services/snapshot-storage.service");
const { checkViolationLimits, autoSubmitTest } = require("../services/violation-checker.service");

/**
 * Start test and get questions
 * GET /api/test-system/exam/start
 */
exports.startTest = async (req, res, next) => {
    try {
        const { testStudentId, testId } = req.testStudent;

        // Get test student details
        const student = await TestStudent.findById(testStudentId);

        // Check if test already started
        let testResponse = await TestResponse.findOne({
            testStudentId,
            testId,
        });

        if (testResponse && testResponse.status === "submitted") {
            return res.status(403).json({
                success: false,
                message: "Test already submitted",
            });
        }

        // Get test details
        const test = await Test.findById(testId);

        if (!test || !test.isActive) {
            return res.status(404).json({
                success: false,
                message: "Test not found or inactive",
            });
        }

        // Get questions based on assigned class and paper set
        const questions = await Question.find({
            instituteId: student.instituteId,
            class: student.assignedClass,
            set: student.assignedPaperSet,
        }).select("-correctAnswer") // Don't send correct answer to client
            .sort({ sr: 1 });

        if (questions.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No questions found for this test",
            });
        }

        // Create test response if not exists
        if (!testResponse) {
            testResponse = await TestResponse.create({
                testStudentId,
                testId,
            });
        }

        res.json({
            success: true,
            data: {
                testResponse: {
                    id: testResponse._id,
                    startTime: testResponse.startTime,
                    status: testResponse.status,
                },
                test: {
                    title: test.title,
                    description: test.description,
                    duration: test.duration,
                    violationRules: test.violationRules,
                },
                questions: questions.map((q) => ({
                    id: q._id,
                    sr: q.sr,
                    question: q.question,
                    optionA: q.optionA,
                    optionB: q.optionB,
                    optionC: q.optionC,
                    optionD: q.optionD,
                })),
                savedAnswers: testResponse.answers || [],
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Save/update answer
 * POST /api/test-system/exam/save-answer
 */
exports.saveAnswer = async (req, res, next) => {
    try {
        const { testStudentId } = req.testStudent;
        const { testResponseId, questionId, selectedOption, timeSpent } = req.body;

        if (!testResponseId || !questionId || !selectedOption) {
            return res.status(400).json({
                success: false,
                message: "testResponseId, questionId, and selectedOption are required",
            });
        }

        const testResponse = await TestResponse.findById(testResponseId);

        if (!testResponse || testResponse.status === "submitted") {
            return res.status(403).json({
                success: false,
                message: "Test not found or already submitted",
            });
        }

        // Update or add answer
        const existingAnswerIndex = testResponse.answers.findIndex(
            (ans) => ans.questionId.toString() === questionId
        );

        if (existingAnswerIndex !== -1) {
            testResponse.answers[existingAnswerIndex].selectedOption = selectedOption;
            testResponse.answers[existingAnswerIndex].timeSpent = timeSpent || 0;
            testResponse.answers[existingAnswerIndex].answeredAt = new Date();
        } else {
            testResponse.answers.push({
                questionId,
                selectedOption,
                timeSpent: timeSpent || 0,
                answeredAt: new Date(),
            });
        }

        await testResponse.save();

        res.json({
            success: true,
            message: "Answer saved",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Submit test
 * POST /api/test-system/exam/submit
 */
exports.submitTest = async (req, res, next) => {
    try {
        const { testStudentId } = req.testStudent;
        const { testResponseId, submitType = "manual" } = req.body;

        if (!testResponseId) {
            return res.status(400).json({
                success: false,
                message: "testResponseId is required",
            });
        }

        const testResponse = await TestResponse.findById(testResponseId);

        if (!testResponse) {
            return res.status(404).json({
                success: false,
                message: "Test response not found",
            });
        }

        if (testResponse.status === "submitted") {
            return res.status(403).json({
                success: false,
                message: "Test already submitted",
            });
        }

        testResponse.status = "submitted";
        testResponse.endTime = new Date();
        testResponse.submitType = submitType;
        await testResponse.save();

        res.json({
            success: true,
            message: "Test submitted successfully",
            data: {
                testResponseId: testResponse._id,
                submitType: testResponse.submitType,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get time remaining
 * GET /api/test-system/exam/time-remaining?testResponseId=xxx
 */
exports.getTimeRemaining = async (req, res, next) => {
    try {
        const { testResponseId } = req.query;

        if (!testResponseId) {
            return res.status(400).json({
                success: false,
                message: "testResponseId is required",
            });
        }

        const testResponse = await TestResponse.findById(testResponseId).populate("testId");

        if (!testResponse) {
            return res.status(404).json({
                success: false,
                message: "Test response not found",
            });
        }

        const test = testResponse.testId;
        const startTime = new Date(testResponse.startTime);
        const currentTime = new Date();
        const elapsedMinutes = Math.floor((currentTime - startTime) / 1000 / 60);
        const remainingMinutes = Math.max(0, test.duration - elapsedMinutes);

        res.json({
            success: true,
            data: {
                remainingMinutes,
                elapsedMinutes,
                totalDuration: test.duration,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Log violation
 * POST /api/test-system/exam/violation
 */
exports.logViolation = async (req, res, next) => {
    try {
        const { testStudentId } = req.testStudent;
        const { testResponseId, violationType, metadata } = req.body;

        if (!testResponseId || !violationType) {
            return res.status(400).json({
                success: false,
                message: "testResponseId and violationType are required",
            });
        }

        // Log violation
        await ProctoringLog.create({
            testResponseId,
            testStudentId,
            violationType,
            metadata,
        });

        // Check if violation limits exceeded
        const testResponse = await TestResponse.findById(testResponseId);
        const violationCheck = await checkViolationLimits(testResponseId, testResponse.testId);

        if (violationCheck.exceeded) {
            // Auto-submit test
            await autoSubmitTest(testResponseId);

            return res.json({
                success: true,
                data: {
                    violationLogged: true,
                    autoSubmitted: true,
                    reason: `${violationCheck.violationType} limit exceeded (${violationCheck.count}/${violationCheck.limit})`,
                },
            });
        }

        res.json({
            success: true,
            data: {
                violationLogged: true,
                autoSubmitted: false,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Upload webcam snapshot
 * POST /api/test-system/exam/snapshot
 */
exports.uploadSnapshot = async (req, res, next) => {
    try {
        const { testStudentId } = req.testStudent;
        const { testResponseId, imageData } = req.body;

        if (!testResponseId || !imageData) {
            return res.status(400).json({
                success: false,
                message: "testResponseId and imageData are required",
            });
        }

        // Save snapshot
        const imageUrl = await saveSnapshot(imageData, testStudentId);

        // Create snapshot record
        await WebcamSnapshot.create({
            testResponseId,
            testStudentId,
            imageUrl,
        });

        res.json({
            success: true,
            message: "Snapshot saved",
        });
    } catch (error) {
        next(error);
    }
};
