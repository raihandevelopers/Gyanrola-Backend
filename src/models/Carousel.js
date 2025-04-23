const mongoose = require("mongoose");

const carouselSchema = new mongoose.Schema({
  link: { type: String, required: true },
  image: { type: String, required: true }, // Path to the image file
});

module.exports = mongoose.model("Carousel", carouselSchema);
