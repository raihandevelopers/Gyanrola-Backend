const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

// test

const app = express();
app.use(express.json());

// Open CORS for all origins
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

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
