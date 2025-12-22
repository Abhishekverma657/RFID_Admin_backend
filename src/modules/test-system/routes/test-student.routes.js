const express = require("express");
const router = express.Router();
const testStudentController = require("../controllers/test-student.controller");

// Admin routes for test student management
router.post("/", testStudentController.createTestStudent);
router.get("/", testStudentController.getTestStudents);
router.put("/:id", testStudentController.updateTestStudent);
router.delete("/:id", testStudentController.deleteTestStudent);
router.post("/:id/assign", testStudentController.assignTestToStudent);

module.exports = router;
