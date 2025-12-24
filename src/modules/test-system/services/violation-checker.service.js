const ProctoringLog = require("../models/proctoring-log.model");
const TestResponse = require("../models/test-response.model");
const Test = require("../models/test.model");

/**
 * Check if violation limits have been exceeded
 * @param {string} testResponseId - Test response ID
 * @param {string} testId - Test ID
 * @returns {Object} - { exceeded: boolean, violationType: string|null }
 */
async function checkViolationLimits(testResponseId, testId) {
    try {
        // Get test violation rules
        const test = await Test.findById(testId);
        if (!test) {
            throw new Error("Test not found");
        }

        const violationRules = test.violationRules;

        // Get all violations for this test response
        const violations = await ProctoringLog.find({ testResponseId });

        // Count violations by type
        const violationCounts = {
            TAB_SWITCH: 0,
            CAMERA_OFF: 0,
            AUDIO_NOISE: 0,
            FULLSCREEN_EXIT: 0,
            WINDOW_BLUR: 0,
        };

        violations.forEach((violation) => {
            if (violationCounts.hasOwnProperty(violation.violationType)) {
                violationCounts[violation.violationType]++;
            }
        });

        // Check each violation type against limits
        let exceeded = false;
        let exceededType = null;
        let exceededCount = 0;
        let exceededLimit = 0;

        for (const [type, count] of Object.entries(violationCounts)) {
            const limit = violationRules[type] || 0;
            if (count >= limit) {
                exceeded = true;
                exceededType = type;
                exceededCount = count;
                exceededLimit = limit;
                break;
            }
        }

        return {
            exceeded,
            violationType: exceededType,
            count: exceededCount,
            limit: exceededLimit,
            // Return all counts for frontend display
            currentCounts: violationCounts,
            rules: violationRules
        };
    } catch (error) {
        console.error("Error checking violation limits:", error);
        throw error;
    }
}

/**
 * Auto-submit test due to violation
 * @param {string} testResponseId - Test response ID
 */
async function autoSubmitTest(testResponseId) {
    try {
        const testResponse = await TestResponse.findById(testResponseId);
        if (!testResponse || testResponse.status === "submitted") {
            return;
        }

        testResponse.status = "submitted";
        testResponse.endTime = new Date();
        testResponse.submitType = "auto-violation";
        await testResponse.save();

        return testResponse;
    } catch (error) {
        console.error("Error auto-submitting test:", error);
        throw error;
    }
}

module.exports = {
    checkViolationLimits,
    autoSubmitTest,
};
