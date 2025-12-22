const XLSX = require("xlsx");
const Question = require("../models/question.model");

/**
 * Parse Excel/CSV file and extract questions
 * @param {Buffer} fileBuffer - Excel or CSV file buffer
 * @param {string} instituteId - Institute ID
 * @returns {Object} - { success, data, errors }
 */
/**
 * Parse Excel/CSV file and extract questions
 * @param {Buffer} fileBuffer - Excel or CSV file buffer
 * @param {string} instituteId - Institute ID
 * @param {string} questionPaperId - Optional Question Paper ID
 * @returns {Object} - { success, data, errors }
 */
async function parseQuestionsExcel(fileBuffer, instituteId, questionPaperId = null) {
    const results = {
        success: [],
        errors: [],
    };

    try {
        // Read Excel file
        const workbook = XLSX.read(fileBuffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);

        // Validate required columns
        const requiredColumns = [
            "class",
            "set",
            "sr",
            "question",
            "optionA",
            "optionB",
            "optionC",
            "optionD",
        ];

        if (rows.length === 0) {
            throw new Error("Excel file is empty");
        }

        // Check if all required columns exist
        const firstRow = rows[0];
        const missingColumns = requiredColumns.filter(
            (col) => !(col in firstRow)
        );

        if (missingColumns.length > 0) {
            throw new Error(
                `Missing required columns: ${missingColumns.join(", ")}`
            );
        }

        // Process each row
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNumber = i + 2; // Excel row number (accounting for header)

            try {
                // Validate set value
                if (!["A", "B", "C", "D"].includes(row.set)) {
                    results.errors.push({
                        row: rowNumber,
                        error: `Invalid set value: ${row.set}. Must be A, B, C, or D`,
                    });
                    continue;
                }

                // Validate sr (serial number)
                if (!row.sr || isNaN(row.sr)) {
                    results.errors.push({
                        row: rowNumber,
                        error: "Serial number (sr) must be a valid number",
                    });
                    continue;
                }

                // Check for duplicate locally if utilizing questionPaperId
                if (questionPaperId) {
                    const existingQuestion = await Question.findOne({
                        questionPaperId,
                        sr: parseInt(row.sr)
                    });
                    if (existingQuestion) {
                        results.errors.push({
                            row: rowNumber,
                            error: `Duplicate question within this paper: sr=${row.sr} already exists`,
                        });
                        continue;
                    }
                } else {
                    // Legacy check
                    const existingQuestion = await Question.findOne({
                        instituteId,
                        class: row.class,
                        set: row.set,
                        sr: parseInt(row.sr),
                        questionPaperId: null
                    });
                    if (existingQuestion) {
                        results.errors.push({
                            row: rowNumber,
                            error: `Duplicate question: class=${row.class}, set=${row.set}, sr=${row.sr} already exists`,
                        });
                        continue;
                    }
                }

                // Prepare question data
                const questionData = {
                    instituteId,
                    questionPaperId: questionPaperId || undefined,
                    class: row.class,
                    set: row.set,
                    sr: parseInt(row.sr),
                    question: row.question,
                    optionA: row.optionA,
                    optionB: row.optionB,
                    optionC: row.optionC,
                    optionD: row.optionD,
                    correctAnswer: row.correctAnswer || null,
                };

                // Validate correctAnswer if provided
                if (
                    questionData.correctAnswer &&
                    !["A", "B", "C", "D"].includes(questionData.correctAnswer)
                ) {
                    results.errors.push({
                        row: rowNumber,
                        error: `Invalid correctAnswer: ${questionData.correctAnswer}. Must be A, B, C, or D`,
                    });
                    continue;
                }

                // Create question
                const question = await Question.create(questionData);
                results.success.push({
                    row: rowNumber,
                    questionId: question._id,
                    class: question.class,
                    set: question.set,
                    sr: question.sr,
                    isEvaluatable: question.isEvaluatable,
                });
            } catch (error) {
                results.errors.push({
                    row: rowNumber,
                    error: error.message,
                });
            }
        }

        return results;
    } catch (error) {
        throw new Error(`File parsing error: ${error.message}`);
    }
}

/**
 * Check if questions are used in any active test
 * @param {string} instituteId
 * @param {string} className
 * @param {string} set
 * @returns {boolean}
 */
async function areQuestionsImmutable(instituteId, className, set) {
    const TestResponse = require("../models/test-response.model");
    const Question = require("../models/question.model");

    // Find questions matching criteria
    const questions = await Question.find({
        instituteId,
        class: className,
        set,
    });

    if (questions.length === 0) return false;

    const questionIds = questions.map((q) => q._id);

    // Check if any of these questions are used in in-progress tests
    const activeResponses = await TestResponse.findOne({
        status: "in-progress",
        "answers.questionId": { $in: questionIds },
    });

    return !!activeResponses;
}

module.exports = {
    parseQuestionsExcel,
    areQuestionsImmutable,
};
