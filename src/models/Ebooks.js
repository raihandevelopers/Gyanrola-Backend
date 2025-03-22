const mongoose = require("mongoose");

const ebookSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  filepath: { type: String, required: true },
});

module.exports = mongoose.model("Ebook", ebookSchema);
