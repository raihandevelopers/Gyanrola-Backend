const Category = require("../models/Category");
const Subcategory = require("../models/Subcategory");

// Create Category
exports.createCategory = async (req, res) => {
  const { name } = req.body;
  try {
    const category = new Category({ name });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Create Subcategory
exports.createSubcategory = async (req, res) => {
  const { name, categoryId } = req.body;
  try {
    const subcategory = new Subcategory({ name, category: categoryId });
    await subcategory.save();

    // Add subcategory to the category's subcategories array
    await Category.findByIdAndUpdate(categoryId, {
      $push: { subcategories: subcategory._id },
    });

    res.status(201).json(subcategory);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get All Categories with Subcategories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate("subcategories");
    res.json({ categories });
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};