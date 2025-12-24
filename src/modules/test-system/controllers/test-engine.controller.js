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

        // --- START TIME CONSTRAINT ---
        if (test.startTime && new Date() < new Date(test.startTime)) {
            return res.status(403).json({
                success: false,
                message: `Test has not started yet. It will start at ${new Date(test.startTime).toLocaleString()}`,
            });
        }
        // -----------------------------

        // Get questions based on assigned class and paper set
        console.log(`DEBUG startTest: Student ${student._id} assignedClass=${student.assignedClass} assignedPaperSet=${student.assignedPaperSet} instituteId=${student.instituteId}`);

        // Get questions based on assigned class and paper set
        console.log(`DEBUG startTest: Student ${student._id} assignedClass=${student.assignedClass} assignedPaperSet=${student.assignedPaperSet} instituteId=${student.instituteId}`);

        const query = {
            instituteId: student.instituteId,
            class: student.assignedClass,
            set: student.assignedPaperSet,
        };

        let questions = await Question.find(query).select("-correctAnswer").sort({ sr: 1 });

        console.log(`DEBUG startTest: Found ${questions.length} questions`);

        if (questions.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No questions found for this test",
                debug: { query, studentId: student._id }
            });
        }

        // --- LEVEL-WISE SHUFFLING LOGIC ---

        // 1. Group by Level
        const grouped = {
            Easy: [],
            Medium: [],
            Hard: []
        };

        questions.forEach(q => {
            const level = q.level || "Medium";
            if (grouped[level]) {
                grouped[level].push(q);
            } else {
                grouped["Medium"].push(q); // Fallback
            }
        });

        // 2. Simple Seeded Shuffle Function (Mulberry32-like behavior)
        const seededShuffle = (array, seedStr) => {
            if (!array.length) return [];

            // Create a numeric seed from string
            let h = 2166136261 >>> 0;
            for (let i = 0; i < seedStr.length; i++) {
                h = Math.imul(h ^ seedStr.charCodeAt(i), 16777619);
            }
            let seed = h >>> 0;

            const rng = () => {
                seed = (seed * 9301 + 49297) % 233280;
                return seed / 233280;
            };

            // Fisher-Yates Shuffle with seeded RNG
            const shuffled = [...array];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(rng() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        };

        // 3. Shuffle each group
        // Seed = TestID + StudentID (Ensures consistency for same student on same test)
        const seed = testId.toString() + testStudentId.toString();

        const sortedQuestions = [
            ...seededShuffle(grouped.Easy, seed + "Easy"),
            ...seededShuffle(grouped.Medium, seed + "Medium"),
            ...seededShuffle(grouped.Hard, seed + "Hard")
        ];

        // ----------------------------------

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
                    testStudentId: testResponse.testStudentId,
                    userId: student.userId,
                    testId: testResponse.testId,
                    startTime: testResponse.startTime,
                    status: testResponse.status,
                },
                test: {
                    title: test.title,
                    description: test.description,
                    duration: test.duration,
                    violationRules: test.violationRules,
                },
                questions: sortedQuestions.map((q) => ({
                    id: q._id,
                    sr: q.sr,
                    question: q.question,
                    questionImage: q.questionImage,
                    level: q.level,
                    questionType: q.questionType,
                    options: q.options,
                    // Legacy support
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

const emailService = require("../services/email.service");

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

        let testResponse = await TestResponse.findById(testResponseId);

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

        // --- SCORE CALCULATION ---
        const test = await Test.findById(testResponse.testId);
        const student = await TestStudent.findById(testStudentId);

        // Fetch questions to get correct answers
        const questionIds = testResponse.answers.map(ans => ans.questionId);
        const questions = await Question.find({ _id: { $in: questionIds } });

        let score = 0;
        let correct = 0;
        let incorrect = 0;
        let unattempted = 0; // Logic for unattempted might need total question count - attempted count

        // Scheme
        const scheme = test.markingScheme || { correct: 4, incorrect: -1, unattempted: 0 };

        // We need total questions count to calculate unattempted
        const totalQuestionsCount = await Question.countDocuments({
            instituteId: test.instituteId,
            class: test.targetClass,
            set: test.targetPaperSet
        });

        // Map for fast lookup
        const questionMap = {};
        questions.forEach(q => { questionMap[q._id.toString()] = q; });

        // Calculate score for ATTEMPTED questions
        testResponse.answers.forEach(ans => {
            const q = questionMap[ans.questionId.toString()];
            if (q) {
                if (ans.selectedOption === q.correctAnswer) {
                    score += scheme.correct;
                    correct++;
                } else {
                    score += scheme.incorrect;
                    incorrect++;
                }
            }
        });

        // Unattempted = Total - Attempted
        unattempted = totalQuestionsCount - testResponse.answers.length;
        score += (unattempted * scheme.unattempted);

        // -------------------------

        testResponse.status = "submitted";
        testResponse.endTime = new Date();
        testResponse.submitType = submitType;

        // Save Score
        testResponse.score = score;
        testResponse.scoreMetadata = {
            totalQuestions: totalQuestionsCount,
            attempted: testResponse.answers.length,
            correct,
            incorrect,
            unattempted
        };
        testResponse.resultPublished = false; // Pending review? User said "when admin result check status update"

        await testResponse.save();

        // Send Email
        try {
            await emailService.sendSubmissionConfirmation(student, test, testResponse.endTime);
        } catch (emailErr) {
            console.error("Failed to send submission email:", emailErr);
        }

        res.json({
            success: true,
            message: "Test submitted successfully",
            data: {
                testResponseId: testResponse._id,
                submitType: testResponse.submitType,
                scoreMetadata: testResponse.scoreMetadata // Optional check
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

        // IMMEDIATELY auto-submit for TAB_SWITCH or CAMERA_OFF as per user request
        if (violationType === "TAB_SWITCH" || violationType === "CAMERA_OFF" || violationType === "FULLSCREEN_EXIT") {
            await autoSubmitTest(testResponseId);
            return res.json({
                success: true,
                data: {
                    violationLogged: true,
                    autoSubmitted: true,
                    reason: `Violation ${violationType} triggered immediate termination.`,
                },
            });
        }

        // Check if other violation limits exceeded
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

        // Get count and limit for the current violation type
        const currentCount = violationCheck.currentCounts ? violationCheck.currentCounts[violationType] : 0;
        const limit = violationCheck.rules ? violationCheck.rules[violationType] : 0;

        res.json({
            success: true,
            data: {
                violationLogged: true,
                autoSubmitted: false,
                warning: {
                    type: violationType,
                    count: currentCount,
                    limit: limit,
                    message: `Warning: ${violationType} detected (${currentCount}/${limit}).`
                }
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

        // Broadcast snapshot to admin in real-time
        try {
            const student = await TestStudent.findById(testStudentId);
            if (student) {
                const { getProctoringNamespace } = require("../socket/proctoring.socket");
                const ns = getProctoringNamespace();
                if (ns) {
                    ns.to(`admin-${student.instituteId}`).emit("student-snapshot", {
                        userId: student.userId,
                        testResponseId,
                        imageUrl,
                        timestamp: new Date()
                    });
                }
            }
        } catch (socketErr) {
            console.error("Error broadcasting snapshot:", socketErr);
        }

        res.json({
            success: true,
            message: "Snapshot saved",
        });
    } catch (error) {
        next(error);
    }
};
