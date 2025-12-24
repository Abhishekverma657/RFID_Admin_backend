const jwt = require("jsonwebtoken");
const TestStudent = require("../models/test-student.model");
const OTP = require("../models/otp.model");
const { generateOTP, sendOTPEmail } = require("../services/otp.service");

/**
 * Request OTP for test access
 * POST /api/test-system/auth/request-otp
 */
const Test = require("../models/test.model");

/**
 * Request OTP for test access
 * POST /api/test-system/auth/request-otp
 */
exports.requestOTP = async (req, res, next) => {
    try {
        const { userId, testId } = req.body;

        if (!userId || !testId) {
            return res.status(400).json({
                success: false,
                message: "userId and testId are required",
            });
        }

        // Find test student
        const testStudent = await TestStudent.findOne({ userId }).populate("assignedTest");

        if (!testStudent) {
            return res.status(404).json({
                success: false,
                message: "Invalid User ID",
            });
        }

        if (!testStudent.isActive) {
            return res.status(403).json({
                success: false,
                message: "Student account is inactive",
            });
        }

        // Check explicit assignment
        let isAssigned = false;
        if (testStudent.assignedTest && testStudent.assignedTest._id.toString() === testId) {
            isAssigned = true;
        } else {
            // Check implicit assignment (Class & Set match)
            const test = await Test.findById(testId);
            if (!test) {
                return res.status(404).json({ success: false, message: "Test not found" });
            }

            if (
                testStudent.assignedClass === test.targetClass &&
                testStudent.assignedPaperSet === test.targetPaperSet
            ) {
                // Auto-assign the test to the student
                testStudent.assignedTest = testId;
                await testStudent.save();
                isAssigned = true;
            }
        }

        if (!isAssigned) {
            return res.status(403).json({
                success: false,
                message: "You are not assigned to this test (Class/Set mismatch)",
            });
        }

        // Generate OTP
        const otpCode = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save OTP to database
        await OTP.create({
            userId,
            otp: otpCode,
            expiresAt,
        });

        // Send OTP via email
        await sendOTPEmail(testStudent.email, otpCode, testStudent.name);

        res.json({
            success: true,
            message: "OTP sent to your email",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Verify OTP and return JWT token
 * POST /api/test-system/auth/verify-otp
 */
exports.verifyOTP = async (req, res, next) => {
    try {
        const { userId, otp } = req.body;

        if (!userId || !otp) {
            return res.status(400).json({
                success: false,
                message: "userId and otp are required",
            });
        }

        // Find OTP
        const otpRecord = await OTP.findOne({
            userId,
            otp,
            isVerified: false,
            expiresAt: { $gt: new Date() },
        });

        if (!otpRecord) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired OTP",
            });
        }

        // Mark OTP as verified
        otpRecord.isVerified = true;
        await otpRecord.save();

        // Get test student
        const testStudent = await TestStudent.findOne({ userId });

        // Get test info for countdown/instructions
        const test = await Test.findById(testStudent.assignedTest).select("title startTime endTime duration");

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: testStudent.userId,
                testStudentId: testStudent._id,
                testId: testStudent.assignedTest,
            },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.json({
            success: true,
            data: {
                token,
                testStudent: {
                    userId: testStudent.userId,
                    name: testStudent.name,
                    testId: testStudent.assignedTest,
                    class: testStudent.assignedClass,
                    paperSet: testStudent.assignedPaperSet,
                },
                test: test, // Include test details
                serverTime: new Date() // For clock sync
            },
        });
    } catch (error) {
        next(error);
    }
};
