const Quiz = require("../models/Quiz");
const Category = require("../models/Category");
const Subcategory = require("../models/Subcategory");

// Create Quiz
const createQuiz = async (req, res) => {
  const { title, description, category, subcategory, questions, isFree } = req.body;

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
      isFree: isFree || false // Default to false if not provided
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
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("createdBy", "email");

    res.json(quizzes);
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
  const { title, description, category, subcategory, questions, isFree } = req.body;

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
        isFree: isFree || false // Default to false if not provided
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

module.exports = {
  createQuiz,
  getQuizzes,
  deleteQuiz,
  getQuizById,
  updateQuiz,
};