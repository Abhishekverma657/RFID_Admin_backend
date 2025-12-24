const { uploadImageFromBuffer } = require("../services/snapshot-storage.service");

exports.uploadImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        // Upload buffer to Cloudinary
        const imageUrl = await uploadImageFromBuffer(req.file.buffer, "question_images");

        res.status(200).json({
            success: true,
            imageUrl: imageUrl
        });
    } catch (error) {
        next(error);
    }
};
