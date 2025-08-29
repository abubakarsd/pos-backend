// const express = require("express");
// const connectDB = require("./config/database");
// const config = require("./config/config");
// const globalErrorHandler = require("./middlewares/globalErrorHandler");
// const cookieParser = require("cookie-parser");
// const cors = require("cors");
// const app = express();

// const PORT = config.port;
// connectDB();

// // Middlewares
// app.use(cors({
//     credentials: true,
//     origin: ['http://localhost:5173']
// }));
// app.use(express.json()); // parse incoming request in json format
// app.use(cookieParser());

// // Root Endpoint
// app.get("/", (req, res) => {
//     res.json({ message: "Hello from POS Server!" });
// });

// // Other Endpoints
// app.use("/api/user", require("./routes/userRoute"));
// app.use("/api/order", require("./routes/orderRoute"));
// app.use("/api/table", require("./routes/tableRoute"));
// app.use("/api/payment", require("./routes/paymentRoute"));
// app.use("/api/category", require("./routes/categoryRoute")); // New line for Category routes
// app.use("/api/dish", require("./routes/dishRoute"));         // New line for Dish routes

// // Global Error Handler
// app.use(globalErrorHandler);

// // Server
// app.listen(PORT, () => {
//     console.log(`☑️  POS Server is listening on port ${PORT}`);
// });
const express = require("express");
const connectDB = require("./config/database");
const config = require("./config/config");
const globalErrorHandler = require("./middlewares/globalErrorHandler");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path"); // New import
const app = express();


const PORT = config.port;
connectDB();

// Middlewares
app.use(cors({
    credentials: true,
    origin: ['http://localhost:5173']
}))
app.use(express.json()); // parse incoming request in json format
app.use(express.urlencoded({ extended: true })); // New line to parse URL-encoded data
app.use(cookieParser())

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // New middleware

// Root Endpoint
app.get("/", (req,res) => {
    res.json({message : "Hello from POS Server!"});
})

// Other Endpoints
app.use("/api/user", require("./routes/userRoute"));
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