const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Save base64 webcam image to Cloudinary
 * @param {string} base64Image - Base64 encoded image (with or without data URI prefix)
 * @param {string} testStudentId - Test student ID
 * @returns {string} - Cloudinary Secure URL
 */
async function saveSnapshot(base64Image, testStudentId) {
    try {
        // Create public ID with timestamp
        const timestamp = Date.now();
        const publicId = `snapshot_${testStudentId}_${timestamp}`;

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(base64Image, {
            folder: "exam_snapshots",
            public_id: publicId,
            resource_type: "image",
        });

        // Return secure URL
        return result.secure_url;
    } catch (error) {
        console.error("Error saving snapshot to Cloudinary:", error);
        throw new Error("Failed to save webcam snapshot");
    }
}

/**
 * Delete snapshot from Cloudinary
 * @param {string} imageUrl - Cloudinary Image URL
 */
async function deleteSnapshot(imageUrl) {
    try {
        if (!imageUrl) return;

        // Extract public ID from URL
        // Example: https://res.cloudinary.com/demo/image/upload/v1/exam_snapshots/snapshot_123.jpg
        const splitUrl = imageUrl.split("/");
        const filename = splitUrl[splitUrl.length - 1]; // snapshot_123.jpg
        const publicId = `exam_snapshots/${filename.split(".")[0]}`;

        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error("Error deleting snapshot from Cloudinary:", error);
        // Don't throw error
    }
}

/**
 * Upload image buffer to Cloudinary via stream
 * @param {Buffer} buffer - File buffer
 * @param {string} folder - Folder name
 * @returns {Promise<string>} - Cloudinary Secure URL
 */
async function uploadImageFromBuffer(buffer, folder = "test_system_images") {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: folder, resource_type: "image" },
            (error, result) => {
                if (error) {
                    console.error("Cloudinary Upload Error:", error);
                    reject(error);
                } else {
                    resolve(result.secure_url);
                }
            }
        );
        uploadStream.end(buffer);
    });
}

/**
 * Upload generic image to Cloudinary (Questions, Options, etc.)
 * @param {string} fileInput - File path or Base64 string
 * @param {string} folder - Folder name (default: "test_system_images")
 * @returns {string} - Cloudinary Secure URL
 */
async function uploadImage(fileInput, folder = "test_system_images") {
    try {
        const result = await cloudinary.uploader.upload(fileInput, {
            folder: folder,
            resource_type: "image",
        });
        return result.secure_url;
    } catch (error) {
        console.error("Error uploading image to Cloudinary:", error);
        throw new Error("Failed to upload image");
    }
}

module.exports = {
    saveSnapshot,
    deleteSnapshot,
    uploadImage,
    uploadImageFromBuffer
};
