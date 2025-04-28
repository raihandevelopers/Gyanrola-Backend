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

// Create Multiple Quizzes
const createMultipleQuizzes = async (req, res) => {
  const quizzes = req.body.quizzes;

  if (!Array.isArray(quizzes) || quizzes.length === 0) {
    return res.status(400).json({ error: "Invalid or empty quizzes array." });
  }

  const session = await Quiz.startSession();
  session.startTransaction();

  try {
    // Pre-fetch all categories and subcategories to minimize DB calls
    const categoryIds = [...new Set(quizzes.map((q) => q.category))];
    const subcategoryIds = [...new Set(quizzes.map((q) => q.subcategory))];

    const categories = await Category.find({ _id: { $in: categoryIds } });
    const subcategories = await Subcategory.find({
      _id: { $in: subcategoryIds },
    });

    const categoryMap = new Map(
      categories.map((cat) => [cat._id.toString(), cat])
    );
    const subcategoryMap = new Map(
      subcategories.map((sub) => [sub._id.toString(), sub])
    );

    const quizDocs = [];
    const errors = [];

    for (const quizData of quizzes) {
      const {
        title,
        description,
        category,
        subcategory,
        questions,
        isFree,
        startDate,
        endDate,
        price,
      } = quizData;

      // Validate required fields
      if (
        !title ||
        !category ||
        !subcategory ||
        !questions ||
        !startDate ||
        !endDate
      ) {
        errors.push({ quiz: quizData, error: "Missing required fields." });
        continue;
      }

      // Validate category
      if (!categoryMap.has(category)) {
        errors.push({
          quiz: quizData,
          error: `Category not found: ${category}`,
        });
        continue;
      }

      // Validate subcategory
      if (!subcategoryMap.has(subcategory)) {
        errors.push({
          quiz: quizData,
          error: `Subcategory not found: ${subcategory}`,
        });
        continue;
      }

      // Validate price for paid quizzes
      if (isFree === false && (!price || price <= 0)) {
        errors.push({
          quiz: quizData,
          error: "Price must be specified and greater than 0 for paid quizzes.",
        });
        continue;
      }

      // Build quiz document
      quizDocs.push({
        title,
        description,
        category,
        subcategory,
        questions,
        startDate,
        endDate,
        createdBy: req.user.id,
        isFree: isFree || false,
        ...(isFree ? {} : { price }),
      });
    }

    if (quizDocs.length === 0 || errors.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ error: "Invalid quizdata present.", details: errors });
    }

    // Batch insert all valid quizzes
    const createdQuizzes = await Quiz.insertMany(quizDocs, { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: "Quizzes created successfully.",
      quizzes: createdQuizzes,
      errors, // Include errors for invalid quizzes
    });
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

// Get All Quizzes (Not filtered by date)
const getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({}, { questions: 0 })
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
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (
      !user ||
      !user.purchases.quizzes.find((quiz) => quiz.quizId == req.params.id)
    ) {
      return res.status(403).json({
        error: user
          ? "You haven't purchased the quiz yet"
          : "User not authenticated",
      });
    }
    // Check if the quiz exists and is not expired
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

const getQuizByIdAdmin = async (req, res) => {
  try {
    // Check if the quiz exists
    const quiz = await Quiz.findById(req.params.id)
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("createdBy", "email");

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
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
  getQuizByIdAdmin,
  createMultipleQuizzes,
};
