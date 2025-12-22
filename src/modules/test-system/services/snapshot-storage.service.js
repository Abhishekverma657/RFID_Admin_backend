const fs = require("fs").promises;
const path = require("path");

/**
 * Save base64 webcam image to disk
 * @param {string} base64Image - Base64 encoded image (with or without data URI prefix)
 * @param {string} testStudentId - Test student ID
 * @returns {string} - Relative file path
 */
async function saveSnapshot(base64Image, testStudentId) {
    try {
        // Remove data URI prefix if present
        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        // Create filename with timestamp
        const timestamp = Date.now();
        const filename = `${testStudentId}_${timestamp}.jpg`;

        // Create directory if it doesn't exist
        const uploadDir = path.join(__dirname, "../../../../uploads/snapshots");
        await fs.mkdir(uploadDir, { recursive: true });

        const filepath = path.join(uploadDir, filename);

        // Write file
        await fs.writeFile(filepath, buffer);

        // Return relative path for storage in database
        return `/uploads/snapshots/${filename}`;
    } catch (error) {
        console.error("Error saving snapshot:", error);
        throw new Error("Failed to save webcam snapshot");
    }
}

/**
 * Delete snapshot file
 * @param {string} imageUrl - Relative path to image
 */
async function deleteSnapshot(imageUrl) {
    try {
        const filepath = path.join(__dirname, "../../../..", imageUrl);
        await fs.unlink(filepath);
    } catch (error) {
        console.error("Error deleting snapshot:", error);
        // Don't throw error - file might already be deleted
    }
}

module.exports = {
    saveSnapshot,
    deleteSnapshot,
};
