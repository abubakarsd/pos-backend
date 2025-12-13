const mongoose = require("mongoose");

const dishSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String, // Store the image URL
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },
    available: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model("Dish", dishSchema);