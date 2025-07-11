const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

// test

const app = express();
app.use(express.json());

// Configure CORS
const allowedOrigins = [
  "https://quiz-admin-fe.vercel.app", // Production frontend
  "http://localhost:5000", // Local development frontend
  "https://quiz-contest-gamma.vercel.app", // Production frontend V2
  "http://localhost:5173",
  "https://quiz-admin-fe-nj3j.vercel.app",
  "https://quiz-user-frontend.vercel.app",
  "https://playquizcontest.com",
  "https://gyaaneralo.com",
  "https://www.gyaaneralo.com", // Added for CORS support
  "https://gyanrola.vercel.app",
  "http://localhost:5173", // For Local Admin Development
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Check if the origin is in the allowed list
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: "GET,POST,PUT,DELETE", // Allowed HTTP methods
    credentials: true, // Allow cookies and credentials
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed HTTP headers
  })
);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/quiz", require("./routes/quiz"));
app.use("/api/score", require("./routes/score"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/category", require("./routes/category"));
app.use("/api/withdrawals", require("./routes/withdrawal"));
app.use("/api/ebooks", require("./routes/ebooks"));
app.use("/api/blogs", require("./routes/blogs"));
app.use("/api/transactions", require("./routes/transaction"));
app.use("/api/carousel", require("./routes/carousel"));

const PORT = process.env.PORT || 4500;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
