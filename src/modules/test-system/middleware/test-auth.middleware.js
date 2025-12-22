const jwt = require("jsonwebtoken");

/**
 * Middleware to protect test student routes
 * Verifies JWT token and extracts test student info
 */
async function protectTestStudent(req, res, next) {
    try {
        let token;

        // Get token from Authorization header
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not authorized to access this route",
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach test student info to request
            req.testStudent = {
                userId: decoded.userId,
                testStudentId: decoded.testStudentId,
                testId: decoded.testId,
            };

            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token",
            });
        }
    } catch (error) {
        next(error);
    }
}

module.exports = {
    protectTestStudent,
};
