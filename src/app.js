const express = require("express");
const path = require("path");
const routes = require("./routes");
const errorHandler = require("./middlewares/error.middleware");

const app = express();
const cors = require('cors');
app.use(cors(
    {
        origin: ["http://localhost:5173", "http://109.106.255.78:5600/", "http://109.106.255.78:5600", "http://localhost:5174", "http://localhost:3000"], // Explicitly allow frontend origins
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
    }
));

app.use(express.json({ limit: '10mb' })); // Increased limit for base64 image uploads

// Serve static files from uploads directory (for webcam snapshots)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use("/api", routes);
app.get("/", (req, res) => {
    res.send("API is running...");
});
app.use(errorHandler);

module.exports = app;
