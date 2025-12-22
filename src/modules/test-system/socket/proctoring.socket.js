/**
 * Socket.IO setup for real-time proctoring and monitoring
 */

const ProctoringLog = require("../models/proctoring-log.model");
const TestStudent = require("../models/test-student.model");

module.exports = (io) => {
    // Namespace for proctoring
    const proctoringNamespace = io.of("/proctoring");

    proctoringNamespace.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);

        /**
         * Admin joins monitoring room
         */
        socket.on("admin-join-monitoring", (data) => {
            const { instituteId } = data;
            socket.join(`admin-${instituteId}`);
            console.log(`Admin joined monitoring room: admin-${instituteId}`);
        });

        /**
         * Student starts test
         */
        socket.on("student-started-test", async (data) => {
            const { testStudentId, testResponseId, userId, testId } = data;

            // Join test room
            socket.join(`test-${testId}`);
            socket.testStudentId = testStudentId;
            socket.testResponseId = testResponseId;

            // Get institute ID to notify admin
            try {
                const testStudent = await TestStudent.findById(testStudentId);
                if (testStudent) {
                    // Notify admin that student started test
                    proctoringNamespace.to(`admin-${testStudent.instituteId}`).emit("student-joined", {
                        userId,
                        testStudentId,
                        testResponseId,
                        timestamp: new Date(),
                    });
                }
            } catch (error) {
                console.error("Error notifying admin:", error);
            }
        });

        /**
         * Violation detected by student
         */
        socket.on("violation-detected", async (data) => {
            const { testStudentId, testResponseId, violationType, userId, metadata } = data;

            try {
                // Get institute ID to notify admin
                const testStudent = await TestStudent.findById(testStudentId);
                if (testStudent) {
                    // Send real-time alert to admin
                    proctoringNamespace.to(`admin-${testStudent.instituteId}`).emit("violation-alert", {
                        userId: userId || testStudent.userId,
                        testStudentId,
                        testResponseId,
                        violationType,
                        timestamp: new Date(),
                        metadata,
                    });
                }
            } catch (error) {
                console.error("Error handling violation:", error);
            }
        });

        /**
         * Test auto-submitted due to violations
         */
        socket.on("test-auto-submitted", async (data) => {
            const { testStudentId, testResponseId, userId, reason } = data;

            try {
                const testStudent = await TestStudent.findById(testStudentId);
                if (testStudent) {
                    // Notify admin of auto-submit
                    proctoringNamespace.to(`admin-${testStudent.instituteId}`).emit("auto-submit-alert", {
                        userId: userId || testStudent.userId,
                        testStudentId,
                        testResponseId,
                        reason,
                        timestamp: new Date(),
                    });
                }
            } catch (error) {
                console.error("Error handling auto-submit:", error);
            }
        });

        /**
         * Timer synchronization request
         */
        socket.on("request-timer-sync", (data) => {
            const { testResponseId } = data;
            // Respond with server time
            socket.emit("timer-sync-response", {
                testResponseId,
                serverTime: new Date().toISOString(),
            });
        });

        /**
         * Student disconnects
         */
        socket.on("disconnect", async () => {
            console.log("Socket disconnected:", socket.id);

            // If student was in test, notify admin
            if (socket.testStudentId) {
                try {
                    const testStudent = await TestStudent.findById(socket.testStudentId);
                    if (testStudent) {
                        proctoringNamespace.to(`admin-${testStudent.instituteId}`).emit("student-disconnected", {
                            userId: testStudent.userId,
                            testStudentId: socket.testStudentId,
                            testResponseId: socket.testResponseId,
                            timestamp: new Date(),
                        });
                    }
                } catch (error) {
                    console.error("Error handling disconnect:", error);
                }
            }
        });
    });
};
