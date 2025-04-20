require("dotenv").config();

const Quiz = require("../models/Quiz");
const Category = require("../models/Category");
const Subcategory = require("../models/Subcategory");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

const {
  StandardCheckoutClient,
  StandardCheckoutPayRequest,
} = require("pg-sdk-node");
const {
  clientId,
  clientSecret,
  clientVersion,
  env,
  APP_FE_URL,
  APP_BE_URL,
} = require("./phonepe_credentials/credentials");

const client = StandardCheckoutClient.getInstance(
  clientId,
  clientSecret,
  clientVersion,
  env
);

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

// Get All Quizzes (Not filtered by date)
const getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find()
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("createdBy", "email");

    res.json(quizzes);
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

// Create Quiz Order with PhonePe Integration
const createQuizOrder = async (req, res) => {
  const { quizId } = req.body;
  const userId = req.user ? req.user.id : null;

  try {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found.",
      });
    }
    console.log("quiz amount: " + quiz.price);
    console.log(
      "if quiz price < 0: " +
        (quiz.price && quiz.price > 1 ? quiz.price : 1) * 100
    );

    const transaction = new Transaction({
      quizId,
      userId: userId, // Null for guest users
      transactionId: `TXN_${Date.now()}`, // Generate a unique transaction ID
      amount: (quiz.price && quiz.price > 1 ? quiz.price : 1) * 100, // Convert to paise (setting quiz price to rs 1, in case of price < 1)
    });

    await transaction.save();

    try {
      const request = StandardCheckoutPayRequest.builder()
        .merchantOrderId(transaction.transactionId)
        .amount(transaction.amount)
        .redirectUrl(`${APP_BE_URL}/api/quiz/verify/${transaction._id}`)
        .build();

      const response = await client.pay(request);
      const checkoutPageUrl = response?.redirectUrl;

      if (!checkoutPageUrl) {
        throw new Error("Failed to retrieve checkout page URL.");
      }

      return res
        .setHeader("Referrer-Policy", "origin-when-cross-origin")
        .status(200)
        .json({
          success: true,
          paymentUrl: checkoutPageUrl,
          transaction,
        });
    } catch (error) {
      console.error("Error during payment initiation:", error);
      return res.status(500).json({
        success: false,
        message: "Error initiating payment.",
        error: error.message,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({
      success: false,
      message: "Error creating transaction.",
      error,
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

    try {
      const response = await client.getOrderStatus(transaction.transactionId);
      const state = response?.state;
      console.log("State:", state);

      if (state === "COMPLETED") {
        transaction.status = "Success";
        await transaction.save();

        const user = await User.findById(transaction.userId);
        if (user) {
          user.purchases.quizzes.push({
            quizId: transaction.quizId,
            transactionId: transaction.transactionId,
          });
          await user.save();
        }

        const quiz = await Quiz.findById(transaction.quizId);

        return res.redirect(
          `${APP_FE_URL}/quiz-play/${quiz.category}/?success=true&subcategory=${quiz.subcategory}&quizId=${transaction.quizId}`
        );
      } else {
        if (state === "FAILED") {
          transaction.status = "Failed";
          await transaction.save();
        }
        return res.redirect(
          `${APP_FE_URL}/quiz-play/${quiz.category}/?success=false`
        );
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      return res.redirect(
        `${APP_FE_URL}/quiz-play/${quiz.category}/?success=false`
      );
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.redirect(
      `${APP_FE_URL}/quiz-play/${quiz.category}/?success=false`
    );
  }
};

module.exports = {
  createQuiz,
  getQuizzes,
  getAllQuizzes,
  deleteQuiz,
  getQuizById,
  updateQuiz,
  createQuizOrder,
  verifyPayment,
};
