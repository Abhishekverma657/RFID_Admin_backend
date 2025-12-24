const express = require("express");
const router = express.Router();
const multer = require("multer");
const questionController = require("../controllers/question.controller");
const uploadController = require("../controllers/upload.controller");

// Configure multer for Excel file upload
const excelUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/csv",
            "application/csv"
        ];
        if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error("Only Excel (.xls, .xlsx) and CSV (.csv) files are allowed"));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
});

// Multer config for generic file upload (images) - Use Memory Storage for direct stream upload
const imageUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Admin routes for question management
router.get("/papers", questionController.getQuestionPapers);
router.delete("/papers/:id", questionController.deleteQuestionPaper);
router.post("/import", excelUpload.single("file"), questionController.importQuestions); // Using excelUpload
// Reorder endpoint must be before /:id to prevent "reorder" being treated as an ID
router.post("/reorder", questionController.reorderQuestions);
router.post("/upload/image", imageUpload.single("image"), uploadController.uploadImage); // Added new route for image upload

router.get("/validate-immutable", questionController.checkImmutable);

router.post("/", questionController.createQuestion);
router.get("/", questionController.getQuestions);
router.put("/:id", questionController.updateQuestion);
router.delete("/:id", questionController.deleteQuestion);
router.get("/validate-immutable", questionController.checkImmutable);

module.exports = router;
