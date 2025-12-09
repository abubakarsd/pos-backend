// Middlewares
app.use(cors({
    credentials: true,
    origin: [
        'http://localhost:5173',
        'https://pos-frontend-drab.vercel.app',
        'https://pos-frontend-git-main-abubakar-haruna-abdulmaliks-projects.vercel.app'
    ]
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