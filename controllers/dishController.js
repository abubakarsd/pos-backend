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
    const { page = 1, limit = 10, category, search, startsWith } = req.query;

    const query = {};

    // Filter by Category
    if (category && category !== 'All') {
      // If category is an ObjectId, use it directly. If name, we might need to look it up or assuming frontend sends names?
      // The current frontend uses names for filtering in some places, but the Dish model stores ObjectId ref.
      // However, POSContext fetchInitialData mapped category object to name string on frontend.
      // But standard way is to filter by ID.
      // Let's check how frontend sends it. Plan said "category name or ID".
      // If the frontend sends a name, we need to find the Category ID first. 
      // OR populate category and filter in memory (bad for pagination).
      // Best approach: Frontend should send ID if possible, or we look it up.
      // For now, let's assume we might receive a Category Name and need to match dishes whose populated category has that name?
      // That's complex in Mongo.
      // Simpler: The Dish model stores `category` as ObjectId.
      // If `req.query.category` is a valid ObjectId, use it.
      // If it's a string like "Mains", we need to find the Category doc first.

      const Category = require("../models/categoryModel"); // unexpected require, but needed if filtering by name
      const mongoose = require("mongoose");

      if (mongoose.Types.ObjectId.isValid(category)) {
        query.category = category;
      } else {
        // It's a name, find the category ID
        const categoryDoc = await Category.findOne({ name: category });
        if (categoryDoc) {
          query.category = categoryDoc._id;
        } else {
          // Category name not found, return empty or ignore? Return empty is safer.
          query.category = null;
        }
      }
    }

    // Search by Name (Regex)
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    // Starts With (for Alphabet filter)
    if (startsWith) {
      query.name = { $regex: `^${startsWith}`, $options: "i" };
    }

    const total = await Dish.countDocuments(query);

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const dishes = await Dish.find(query)
      .populate("category")
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 }); // Newest first

    res.status(200).json({
      success: true,
      data: dishes,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      }
    });
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

const deleteDish = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createHttpError(404, "Invalid dish ID!"));
    }

    const deletedDish = await Dish.findByIdAndDelete(id);

    if (!deletedDish) {
      return next(createHttpError(404, "Dish not found!"));
    }

    res.status(200).json({ success: true, message: "Dish deleted!", data: deletedDish });
  } catch (error) {
    next(error);
  }
};

module.exports = { addDish, getDishes, updateDish, deleteDish };