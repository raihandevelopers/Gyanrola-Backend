const Ebook = require("../models/Ebooks");

exports.uploadEbook = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: "No file uploaded or invalid file type" });
    }

    const { name, description, price, category } = req.body;
    if (!name || !description || !price || !category) {
      return res.status(400).json({
        error: "Name, description, price, and category are required.",
      });
    }

    const newEbook = new Ebook({
      name,
      description,
      price,
      category,
      filepath: req.file.path,
    });

    await newEbook.save();
    res.status(201).json(newEbook);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.downloadEbook = async (req, res) => {
  try {
    const ebook = await Ebook.findById(req.params.id);
    if (!ebook) {
      return res.status(404).json({ error: "Ebook not found" });
    }
    res.download(ebook.filepath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all Ebook metadata (excluding the file path)
exports.getAllEbooks = async (req, res) => {
  try {
    // Exclude the 'filepath' field from the response
    const ebooks = await Ebook.find().select("-filepath").populate("category");
    res.json(ebooks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
