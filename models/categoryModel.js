const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        unique: true 
    },
    image: { 
        type: String, // You might store the image URL here
        required: true 
    }
});

module.exports = mongoose.model("Category", categorySchema);