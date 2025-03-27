const Ebook = require("../models/Ebooks");
const fs = require("fs");
const path = require("path");

// Upload new ebook
exports.uploadEbook = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded or invalid file type",
      });
    }

    const { name, description, price, category } = req.body;
    if (!name || !description || !price || !category) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: "Name, description, price, and category are required.",
      });
    }

    const newEbook = new Ebook({
      name,
      description,
      price,
      category,
      filepath: req.file.path.replace(/\\/g, "/"), // Normalize file path for cross-platform compatibility
    });

    await newEbook.save();

    res.status(201).json({
      success: true,
      message: "Ebook uploaded successfully",
      data: newEbook,
    });
  } catch (error) {
    // Clean up uploaded file if error occurs
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all ebooks
exports.getAllEbooks = async (req, res) => {
  try {
    const ebooks = await Ebook.find().select("-filepath").populate("category");

    res.status(200).json({
      success: true,
      count: ebooks.length,
      data: ebooks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single ebook
exports.getEbookById = async (req, res) => {
  try {
    const ebook = await Ebook.findById(req.params.id)
      .select("-filepath")
      .populate("category");

    if (!ebook) {
      return res.status(404).json({
        success: false,
        message: "Ebook not found",
      });
    }

    res.status(200).json({
      success: true,
      data: ebook,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update ebook
exports.updateEbook = async (req, res) => {
  try {
    const { name, description, price, category } = req.body;
    const updateData = { name, description, price, category };
    let oldFilePath = null;

    if (req.file) {
      // Get current file path before updating
      const ebook = await Ebook.findById(req.params.id);
      oldFilePath = ebook.filepath;

      // Add new file path to update data
      updateData.filepath = req.file.path.replace(/\\/g, "/"); // Normalize file path for cross-platform compatibility
    }

    const updatedEbook = await Ebook.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedEbook) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: "Ebook not found",
      });
    }

    // Delete old file if a new one was uploaded
    if (req.file && oldFilePath) {
      fs.unlinkSync(oldFilePath);
    }

    res.status(200).json({
      success: true,
      message: "Ebook updated successfully",
      data: updatedEbook,
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete ebook
exports.deleteEbook = async (req, res) => {
  try {
    const ebook = await Ebook.findByIdAndDelete(req.params.id);

    if (!ebook) {
      return res.status(404).json({
        success: false,
        message: "Ebook not found",
      });
    }

    // Delete the associated file
    const filePath = path.resolve(ebook.filepath); // Converts to OS-specific format
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.status(200).json({
      success: true,
      message: "Ebook deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Download ebook file
exports.downloadEbook = async (req, res) => {
  try {
    const ebook = await Ebook.findById(req.params.id);

    if (!ebook) {
      return res.status(404).json({
        success: false,
        message: "Ebook not found",
      });
    }

    const filePath = path.resolve(ebook.filepath); // Converts to OS-specific format
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    res.download(filePath, `${ebook.name}.pdf`, (err) => {
      if (err) {
        console.error("Download error:", err);
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
