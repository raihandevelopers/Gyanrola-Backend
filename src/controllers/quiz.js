const Quiz = require("../models/Quiz");
const Category = require("../models/Category");
const Subcategory = require("../models/Subcategory");

// Create Quiz
const createQuiz = async (req, res) => {
  const { title, description, category, subcategory, questions } = req.body;

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
      questions,
      createdBy: req.user.id,
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
    const quizzes = await Quiz.find()
      .populate("category", "name") // Populate category name
      .populate("subcategory", "name") // Populate subcategory name
      .populate("createdBy", "email"); // Populate creator email

    res.json(quizzes);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get Quiz by ID
const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate("category", "name") // Populate category name
      .populate("subcategory", "name") // Populate subcategory name
      .populate("createdBy", "email"); // Populate creator email

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
    const quiz = await Quiz.findByIdAndDelete(req.params.id); // Find and delete the quiz by ID
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
  const { id } = req.params; // Quiz ID
  const { title, description, category, subcategory, questions } = req.body;

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
      { title, description, category, subcategory, questions },
      { new: true } // Return the updated quiz
    );

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    res.status(200).json(quiz);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Export all functions
module.exports = {
  createQuiz,
  getQuizzes,
  deleteQuiz,
  getQuizById,
  updateQuiz,
};
