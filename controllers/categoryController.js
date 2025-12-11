const Category = require("../models/categoryModel");
const createHttpError = require("http-errors");
const mongoose = require("mongoose");

const addCategory = async (req, res, next) => {
  try {
    const { name } = req.body;
    const imagePath = req.file ? req.file.path : null; // Get the image path from multer

    if (!name || !imagePath) {
      return next(
        createHttpError(400, "Please provide category name and image!")
      );
    }

    const isCategoryPresent = await Category.findOne({ name });
    if (isCategoryPresent) {
      return next(createHttpError(400, "Category already exists!"));
    }

    const newCategory = new Category({ name, image: imagePath });
    await newCategory.save();
    res
      .status(201)
      .json({ success: true, message: "Category added!", data: newCategory });
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find();
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, image } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createHttpError(404, "Invalid category ID!"));
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { name, image },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return next(createHttpError(404, "Category not found!"));
    }

    res.status(200).json({ success: true, message: "Category updated!", data: updatedCategory });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createHttpError(404, "Invalid category ID!"));
    }

    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return next(createHttpError(404, "Category not found!"));
    }

    res.status(200).json({ success: true, message: "Category deleted!", data: deletedCategory });
  } catch (error) {
    next(error);
  }
};

module.exports = { addCategory, getCategories, updateCategory, deleteCategory };