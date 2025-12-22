const express = require("express");
const router = express.Router();
const multer = require("multer");
const questionController = require("../controllers/question.controller");

// Configure multer for Excel file upload
const upload = multer({
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

// Admin routes for question management
router.get("/papers", questionController.getQuestionPapers);
router.delete("/papers/:id", questionController.deleteQuestionPaper);
router.post("/import", upload.single("file"), questionController.importQuestions);
router.get("/", questionController.getQuestions);
router.delete("/:id", questionController.deleteQuestion);
router.get("/validate-immutable", questionController.checkImmutable);

module.exports = router;
