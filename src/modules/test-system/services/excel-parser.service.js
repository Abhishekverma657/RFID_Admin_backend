const XLSX = require("xlsx");
const Question = require("../models/question.model");

console.log("=== EXCEL PARSER SERVICE LOADED (v2) ===");

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
async function parseQuestionsExcel(fileBuffer, instituteId, questionPaperId = null, defaultClass = null, defaultSet = null) {
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
        // Removed 'sr' as it is now auto-generated if missing
        const requiredColumns = [
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
        console.log("DEBUG: Excel columns found:", Object.keys(firstRow));

        const missingColumns = requiredColumns.filter(
            (col) => !(col in firstRow)
        );

        if (missingColumns.length > 0) {
            throw new Error(
                `Missing required columns: ${missingColumns.join(", ")}. Found columns: ${Object.keys(firstRow).join(", ")}`
            );
        }

        if (!defaultClass || !defaultSet) {
            // In new flow, these are always passed.
            // But let's check just in case.
        }

        // Get current max SR for this paper to append
        let currentMaxSr = 0;
        if (questionPaperId) {
            const lastQ = await Question.findOne({ questionPaperId }).sort({ sr: -1 });
            if (lastQ) currentMaxSr = lastQ.sr;
        } else {
            // Legacy fallback
            const lastQ = await Question.findOne({ instituteId, class: defaultClass, set: defaultSet }).sort({ sr: -1 });
            if (lastQ) currentMaxSr = lastQ.sr;
        }

        // Process each row
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNumber = i + 2;

            try {
                // Determine SR: Use DB sequence if not in file
                let finalSr = row.sr;
                if (!finalSr) {
                    currentMaxSr++;
                    finalSr = currentMaxSr;
                } else if (isNaN(finalSr)) {
                    // If Sr provided but invalid
                    results.errors.push({
                        row: rowNumber,
                        error: "Serial number (sr) provided but invalid",
                    });
                    continue;
                } else {
                    // Update max if manually provided
                    if (finalSr > currentMaxSr) currentMaxSr = finalSr;
                }

                // Prepare Options Array
                const options = [
                    { text: row.optionA, id: "0", image: null },
                    { text: row.optionB, id: "1", image: null },
                    { text: row.optionC, id: "2", image: null },
                    { text: row.optionD, id: "3", image: null },
                ];

                // Map Correct Answer (A/B/C/D) to Index
                let correctOptionIndex = null;
                const ca = row.correctAnswer ? row.correctAnswer.toUpperCase().trim() : null;
                const mapping = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };

                if (ca && mapping.hasOwnProperty(ca)) {
                    correctOptionIndex = mapping[ca];
                }

                // Prepare question data
                const questionData = {
                    instituteId,
                    questionPaperId: questionPaperId || undefined,
                    class: defaultClass,
                    set: defaultSet,
                    sr: finalSr,
                    question: row.question,
                    questionImage: null, // Excel doesn't support direct image upload easily yet
                    level: row.level || "Medium", // Default to Medium if not specified

                    // New Structure
                    options: options,
                    correctOptionIndex: correctOptionIndex,

                    // Legacy Sync (optional, for safety)
                    optionA: row.optionA,
                    optionB: row.optionB,
                    optionC: row.optionC,
                    optionD: row.optionD,
                    correctAnswer: ca,

                    isEvaluatable: correctOptionIndex !== null
                };

                // Create question
                const question = await Question.create(questionData);

                results.success.push({
                    row: rowNumber,
                    questionId: question._id,
                    sr: question.sr,
                    question: question.question,
                    options: question.options,
                    level: question.level
                });
            } catch (error) {
                console.error("Row Error:", error);
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
