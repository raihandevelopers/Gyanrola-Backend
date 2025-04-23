const Carousel = require("../models/Carousel");
const fs = require("fs");
const path = require("path");

// Get all carousel images
exports.getCarouselImages = async (req, res) => {
  try {
    const images = await Carousel.find();
    res.status(200).json({ success: true, data: images });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Upload a new carousel image
exports.uploadCarouselImage = async (req, res) => {
  try {
    const { link } = req.body;
    if (!link || !req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Link and image are required." });
    }

    const newImage = new Carousel({
      link,
      image: req.file.path.replace(/\\/g, "/"), // Normalize file path
    });
    await newImage.save();

    res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      data: newImage,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Edit an existing carousel image
exports.editCarouselImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { link } = req.body;

    const updateData = { link };
    let oldImagePath = null;

    if (req.file) {
      const carousel = await Carousel.findById(id);
      if (!carousel) {
        fs.unlinkSync(req.file.path);
        return res
          .status(404)
          .json({ success: false, message: "Image not found" });
      }

      oldImagePath = carousel.image;
      updateData.image = req.file.path.replace(/\\/g, "/");
    }

    const updatedImage = await Carousel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedImage) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res
        .status(404)
        .json({ success: false, message: "Image not found" });
    }

    if (req.file && oldImagePath && fs.existsSync(oldImagePath)) {
      fs.unlinkSync(oldImagePath);
    }

    res.status(200).json({
      success: true,
      message: "Image updated successfully",
      data: updatedImage,
    });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a carousel image
exports.deleteCarouselImage = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedImage = await Carousel.findByIdAndDelete(id);
    if (!deletedImage) {
      return res
        .status(404)
        .json({ success: false, message: "Image not found" });
    }

    const imagePath = path.resolve(deletedImage.image);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    res
      .status(200)
      .json({ success: true, message: "Image deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Download carousel image
exports.getCarouselImage = async (req, res) => {
  try {
    const { id } = req.params;
    const carousel = await Carousel.findById(id);

    if (!carousel) {
      return res
        .status(404)
        .json({ success: false, message: "Image not found" });
    }

    const imagePath = path.resolve(carousel.image);
    if (!fs.existsSync(imagePath)) {
      return res
        .status(404)
        .json({ success: false, message: "File not found" });
    }

    res.sendFile(imagePath);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
