const Test = require("../models/test.model");
const emailService = require("../services/email.service");
const TestStudent = require("../models/test-student.model");
const { generateUniqueUserId } = require("../services/user-id-generator.service");

/**
 * Create a new test student
 * POST /api/test-system/students
 */
exports.createTestStudent = async (req, res, next) => {
    try {
        const { name, email, rollNumber, mobileNumber, instituteId, testId, className, paperSet } = req.body;

        // Validate required fields
        if (!name || !email || !instituteId) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and instituteId are required",
            });
        }

        // Generate unique user ID
        const userId = await generateUniqueUserId();

        // Create test student
        const testStudent = await TestStudent.create({
            instituteId,
            userId,
            name,
            email,
            rollNumber,
            mobileNumber,
            assignedTest: testId || undefined,
            assignedClass: className || undefined,
            assignedPaperSet: paperSet || undefined,
        });

        // Send Email if Test is Assigned
        if (testId) {
            try {
                const test = await Test.findById(testId);
                if (test) {
                    await emailService.sendStudentCredentials(testStudent, test, userId); // Password is same as userId for now
                }
            } catch (emailErr) {
                console.error("Failed to send credential email:", emailErr);
                // Continue without failing request
            }
        }

        res.status(201).json({
            success: true,
            data: testStudent,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all test students for an institute
 * GET /api/test-system/students?instituteId=xxx
 */
exports.getTestStudents = async (req, res, next) => {
    try {
        const { instituteId } = req.query;
        console.log("DEBUG: getTestStudents called. instituteId:", instituteId, "Type:", typeof instituteId);

        if (!instituteId) {
            return res.status(400).json({
                success: false,
                message: "instituteId is required",
            });
        }

        const students = await TestStudent.find({ instituteId })
            .populate("assignedTest", "title")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: students.length,
            data: students,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update test student
 * PUT /api/test-system/students/:id
 */
exports.updateTestStudent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, isActive } = req.body;

        const testStudent = await TestStudent.findByIdAndUpdate(
            id,
            { name, email, isActive },
            { new: true, runValidators: true }
        );

        if (!testStudent) {
            return res.status(404).json({
                success: false,
                message: "Test student not found",
            });
        }

        res.json({
            success: true,
            data: testStudent,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete test student
 * DELETE /api/test-system/students/:id
 */
exports.deleteTestStudent = async (req, res, next) => {
    try {
        const { id } = req.params;

        const testStudent = await TestStudent.findByIdAndDelete(id);

        if (!testStudent) {
            return res.status(404).json({
                success: false,
                message: "Test student not found",
            });
        }

        res.json({
            success: true,
            message: "Test student deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Assign test, class, and paper set to student
 * POST /api/test-system/students/:id/assign
 */
exports.assignTestToStudent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { testId, className, paperSet } = req.body;

        if (!testId || !className || !paperSet) {
            return res.status(400).json({
                success: false,
                message: "testId, className, and paperSet are required",
            });
        }

        const testStudent = await TestStudent.findByIdAndUpdate(
            id,
            {
                assignedTest: testId,
                assignedClass: className,
                assignedPaperSet: paperSet,
            },
            { new: true, runValidators: true }
        ).populate("assignedTest", "title duration");

        if (!testStudent) {
            return res.status(404).json({
                success: false,
                message: "Test student not found",
            });
        }

        // Send Email with credentials
        try {
            const test = await Test.findById(testId);
            if (test) {
                // Determine password (currently same as userId)
                await emailService.sendStudentCredentials(testStudent, test, testStudent.userId);
            }
        } catch (emailErr) {
            console.error("Failed to send credential email in assignTestToStudent:", emailErr);
        }

        res.json({
            success: true,
            data: testStudent,
        });
    } catch (error) {
        next(error);
    }
};
