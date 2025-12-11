const express = require("express");
const connectDB = require("./config/database");
const config = require("./config/config");
const globalErrorHandler = require("./middlewares/globalErrorHandler");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const app = express();


const PORT = config.port;
connectDB();

// Middlewares
app.use(cors({
    credentials: true,
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:3000',
            'http://localhost:5174',
            'https://pos-frontend-drab.vercel.app',
            /^https:\/\/pos-frontend-.*\.vercel\.app$/, // Allow all Vercel preview deployments
            /^http:\/\/localhost:\d+$/ // Allow all localhost ports
        ];

        const isAllowed = allowedOrigins.some(pattern => {
            if (pattern instanceof RegExp) {
                return pattern.test(origin);
            }
            return pattern === origin;
        });

        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}))
app.use(express.json()); // parse incoming request in json format
app.use(express.urlencoded({ extended: true })); // New line to parse URL-encoded data
app.use(cookieParser())

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // New middleware

// Root Endpoint
app.get("/", (req, res) => {
    res.json({ message: "Hello from POS Server!" });
})

// Other Endpoints
app.use("/api/user", require("./routes/userRoute"));
app.use("/api/role", require("./routes/roleRoute"));
app.use("/api/order", require("./routes/orderRoute"));
app.use("/api/table", require("./routes/tableRoute"));
app.use("/api/payment", require("./routes/paymentRoute"));
app.use("/api/category", require("./routes/categoryRoute"));
app.use("/api/dish", require("./routes/dishRoute"));

// Global Error Handler
app.use(globalErrorHandler);


// Server
app.listen(PORT, () => {
    console.log(`☑️  POS Server is listening on port ${PORT}`);
});