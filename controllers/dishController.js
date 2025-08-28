const Dish = require("../models/dishModel");
const createHttpError = require("http-errors");
const mongoose = require("mongoose");

const addDish = async (req, res, next) => {
    try {
        const { name, price, description, image, category } = req.body;
        if (!name || !price || !description || !image || !category) {
            return next(createHttpError(400, "Please provide all required fields!"));
        }

        const isDishPresent = await Dish.findOne({ name });
        if (isDishPresent) {
            return next(createHttpError(400, "Dish already exists!"));
        }

        const newDish = new Dish({ name, price, description, image, category });
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
        const { name, price, description, image, category } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return next(createHttpError(404, "Invalid dish ID!"));
        }

        const updatedDish = await Dish.findByIdAndUpdate(
            id,
            { name, price, description, image, category },
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