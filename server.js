require("./src/modules/attendance/mark_absent_scheduler");
require("dotenv").config();
const socketIO = require("socket.io");
const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 5000;

// Initialize Socket.IO with CORS configuration
const io = socketIO({
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Initialize Socket.IO handlers
require("./src/modules/test-system/socket/proctoring.socket")(io);

connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Socket.IO enabled for real-time proctoring`);
  });

  // Attach Socket.IO to the HTTP server
  io.attach(server);
});

// Force restart 1

