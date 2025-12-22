const TestStudent = require("../models/test-student.model");

/**
 * Generate unique User ID for test students
 * Format: TEST2025-XXXXX
 * @returns {string} - Unique user ID
 */
async function generateUniqueUserId() {
    const year = new Date().getFullYear();
    let userId;
    let exists = true;

    while (exists) {
        // Generate 5-digit random number
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        userId = `TEST${year}-${randomNum}`;

        // Check if it already exists
        const existingStudent = await TestStudent.findOne({ userId });
        exists = !!existingStudent;
    }

    return userId;
}

module.exports = {
    generateUniqueUserId,
};
