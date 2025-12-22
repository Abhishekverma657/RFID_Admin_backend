const express = require("express");
const router = express.Router();

// Aggregate all test-system routes
router.use("/students", require("./routes/test-student.routes"));
router.use("/tests", require("./routes/test.routes"));
router.use("/questions", require("./routes/question.routes"));
router.use("/auth", require("./routes/test-auth.routes"));
router.use("/exam", require("./routes/test-engine.routes"));
router.use("/results", require("./routes/result.routes"));

module.exports = router;
