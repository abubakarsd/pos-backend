const Dish = require("../models/dishModel");
const createHttpError = require("http-errors");
const mongoose = require("mongoose");

const addDish = async (req, res, next) => {
  try {
    const { name, price, description, category, available, image } = req.body;
    // Allow image from file upload OR body (for emojis/text icons)
    const imagePath = req.file ? req.file.path : image;

    if (!name || !price || !description || !category) {
      return next(createHttpError(400, "Please provide all required fields!"));
    }

    // If no image provided at all
    if (!imagePath) {
      return next(createHttpError(400, "Please provide an image or icon!"));
    }

    const isDishPresent = await Dish.findOne({ name });
    if (isDishPresent) {
      return next(createHttpError(400, "Dish already exists!"));
    }

    const newDish = new Dish({
      name,
      price,
      description,
      image: imagePath,
      category,
      available: available !== undefined ? available : true
    });
    await newDish.save();
    res.status(201).json({ success: true, message: "Dish added!", data: newDish });
  } catch (error) {
    next(error);
  }
};

const getDishes = async (req, res, next) => {
  try {
    const dishes = await Dish.find().populate("category");
    res.status(200).json({ success: true, data: dishes });
  } catch (error) {
    next(error);
  }
};

const updateDish = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, price, description, image, category, available } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createHttpError(404, "Invalid dish ID!"));
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (price) updateData.price = price;
    if (description) updateData.description = description;
    if (image) updateData.image = image;
    if (category) updateData.category = category;
    if (available !== undefined) updateData.available = available;

    if (req.file) {
      updateData.image = req.file.path;
    }

    const updatedDish = await Dish.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedDish) {
      return next(createHttpError(404, "Dish not found!"));
    }

    res.status(200).json({ success: true, message: "Dish updated!", data: updatedDish });
  } catch (error) {
    next(error);
  }
};

module.exports = { addDish, getDishes, updateDish };