require("dotenv").config();

const Quiz = require("../models/Quiz");
const Category = require("../models/Category");
const Subcategory = require("../models/Subcategory");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const crypto = require("crypto");
const axios = require("axios");

const CLIENT_SECRET = process.env.CLIENT_SECRET;
const CLIENT_VERSION = process.env.CLIENT_VERSION;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_MID = CLIENT_ID || process.env.CLIENT_MID;
const APP_BE_URL = process.env.APP_BE_URL;
const APP_FE_URL = process.env.APP_FE_URL;

// Create Quiz
const createQuiz = async (req, res) => {
  const {
    title,
    description,
    category,
    subcategory,
    questions,
    isFree,
    startDate,
    endDate,
  } = req.body;

  try {
    // Validate category
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ error: "Category not found" });
    }

    // Validate subcategory
    const subcategoryExists = await Subcategory.findById(subcategory);
    if (!subcategoryExists) {
      return res.status(400).json({ error: "Subcategory not found" });
    }

    // Create the quiz
    const quiz = new Quiz({
      title,
      description,
      category,
      subcategory,
      startDate,
      endDate,
      questions,
      createdBy: req.user.id,
      isFree: isFree || false, // Default to false if not provided
      ...(isFree ? {} : { price: req.body.price }), // Include price only if not free
    });

    await quiz.save();
    res.status(201).json(quiz);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get All Quizzes
const getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({}, { questions: 0 }) // Exclude the 'questions' field
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("createdBy", "email");

    const quizNotExpired = quizzes.filter((quiz) => {
      const currentDate = new Date();
      return quiz.endDate > currentDate; // Filter out quizzes that have already ended
    });

    res.json(quizNotExpired);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get Quiz by ID
const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("createdBy", "email");

    const currentDate = new Date();
    if (!quiz || quiz.endDate <= currentDate) {
      return res.status(404).json({ error: "Quiz not found or has expired" });
    }

    if (quiz.startDate > currentDate) {
      return res.status(404).json({ error: "Quiz not started yet" });
    }

    res.json(quiz);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete Quiz
const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }
    res.status(200).json({ message: "Quiz deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update Quiz
const updateQuiz = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    category,
    subcategory,
    questions,
    isFree,
    startDate,
    endDate,
  } = req.body;

  try {
    // Validate category
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ error: "Category not found" });
    }

    // Validate subcategory
    const subcategoryExists = await Subcategory.findById(subcategory);
    if (!subcategoryExists) {
      return res.status(400).json({ error: "Subcategory not found" });
    }

    // Find and update the quiz
    const quiz = await Quiz.findByIdAndUpdate(
      id,
      {
        title,
        description,
        category,
        subcategory,
        questions,
        startDate,
        endDate,
        isFree: isFree || false, // Default to false if not provided
        ...(isFree ? {} : { price: req.body.price }), // Include price only if not free
      },
      { new: true }
    );

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    res.status(200).json(quiz);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const PHONE_PE_HOST_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox"; // Updated to use the correct URL
// const PHONE_PE_HOST_URL = "https://api.phonepe.com/apis/hermes";
// const PRODUCTION_PHONE_PE_HOST_URL = "https://api.phonepe.com/apis/hermes"; // Added production URL

const PHONEPE_MERCHANT_ID = "UATSB123";
const PHONEPE_MERCHANT_KEY = "69cd2942-0674-4b03-aeb2-8693818a4d2a";
const PHONEPE_CALLBACK_URL = "your_callback_url";
const PHONEPE_BASE_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox";
const PHONEPE_SALT_INDEX = 1;

const ENDPOINT = "/pg/v1/pay";

// Create Quiz Order with PhonePe Integration
const createQuizOrder = async (req, res) => {
  const { quizId } = req.body;
  const userId = req.user.id;

  try {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found.",
      });
    }

    const transaction = new Transaction({
      quizId,
      userId: userId || null, // Null for guest users
      transactionId: `TXN_${Date.now()}`, // Generate a unique transaction ID
      amount: (quiz.price ?? 100) * 100, // Convert to paise (see if quiz has a price or default to 100)
    });

    await transaction.save();

    const payload = {
      merchantId: PHONEPE_MERCHANT_ID,
      merchantTransactionId: transaction.transactionId,
      merchantUserId: userId || "guest",
      amount: transaction.amount,
      redirectUrl: `${APP_BE_URL}/api/quiz/verify/${transaction._id}`,
      redirectMode: "REDIRECT",
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    console.log("Payload:", payload);
    console.log("Payload String:", JSON.stringify(payload));
    const payloadString = JSON.stringify(payload);
    const checksumString =
      Buffer.from(payloadString).toString("base64") +
      "/pg/v1/pay" +
      (PHONEPE_MERCHANT_KEY ||
        "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399" ||
        CLIENT_SECRET);
    console.log("Checksum String:", checksumString);
    const checksum =
      crypto.createHash("sha256").update(checksumString).digest("hex") +
      "###" +
      PHONEPE_SALT_INDEX; // Use the correct salt index
    console.log("Checksum:", checksum);

    const response = await axios.post(
      `${PHONE_PE_HOST_URL}${ENDPOINT}`,
      { request: Buffer.from(payloadString).toString("base64") },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": checksum,
          accept: "application/json",
        },
      }
    );

    if (response.data.success) {
      res.status(200).json({
        success: true,
        paymentUrl: response.data.data.instrumentResponse.redirectInfo.url,
        transaction,
      });
    } else {
      throw new Error(response.data.message || "Payment initiation failed.");
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({
      success: false,
      message: "Error creating transaction.",
      error: error.response.data || error.message,
    });
  }
};

// Verify Payment Status
const verifyPayment = async (req, res) => {
  const { id } = req.params;

  try {
    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });
    }

    console.log("Transaction ID:", transaction.transactionId);

    const statusUrl = `${PHONE_PE_HOST_URL}/pg/v1/status/${PHONEPE_MERCHANT_ID}/${transaction.transactionId}`;
    const checksumString =
      `/pg/v1/status/${PHONEPE_MERCHANT_ID}/${transaction.transactionId}` +
      (PHONEPE_MERCHANT_KEY || "a2c947e3-1a9a-44fa-8d3d-d5ab5e936a3a");
    const checksum =
      crypto.createHash("sha256").update(checksumString).digest("hex") +
      "###" +
      PHONEPE_SALT_INDEX; // Use the correct salt index

    const response = await axios.get(statusUrl, {
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
        accept: "application/json",
      },
    });

    if (response.data && response.data.code === "PAYMENT_SUCCESS") {
      transaction.status = "Success";
      await transaction.save();
      console.log("Transaction saved successfully:", transaction);

      const user = await User.findById(transaction.userId);
      user.purchases.quizzes.push({
        quizId: transaction.quizId,
        transactionId: transaction.transactionId,
      });
      await user.save();

      const quiz = await Quiz.findById(transaction.quizId);

      res.redirect(
        `${APP_FE_URL}/quiz-play/${quiz.category}/?success=true&subcategory=${quiz.subcategory}&quizId=${transaction.quizId}`
      );
    } else {
      transaction.status = "Failed";
      await transaction.save();

      res.status(400).json({
        success: false,
        message: "Payment failed or is pending.",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error verifying payment.",
      error: error.message,
    });
  }
};

module.exports = {
  createQuiz,
  getQuizzes,
  deleteQuiz,
  getQuizById,
  updateQuiz,
  createQuizOrder,
  verifyPayment,
};
