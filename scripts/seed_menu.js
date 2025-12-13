const mongoose = require('mongoose');
const Category = require('../models/categoryModel');
const Dish = require('../models/dishModel');
const config = require('../config/config');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const categories = [
    { name: "Jollof", image: "🍚" },
    { name: "Soups", image: "🍲" },
    { name: "Swallow", image: "🥣" },
    { name: "Meat/Fish", image: "🍗" },
    { name: "Sides", image: "🥗" },
    { name: "Drinks", image: "🥤" },
    { name: "Takeaway", image: "🛍️" },
    { name: "Main Course", image: "🍽️" } // Providing fallback
];

const dishes = [
    { name: "Jollof Rice", price: 2500, description: "Classic Nigerian smoky Jollof Rice", image: "🍚", categoryName: "Jollof" },
    { name: "Egusi Soup", price: 3000, description: "Rich melon seed soup with pumpkin leaves", image: "🍲", categoryName: "Soups" },
    { name: "Pounded Yam", price: 1500, description: "Smooth and stretchy pounded yam", image: "🥣", categoryName: "Swallow" },
    { name: "Fried Rice", price: 2500, description: "Nigerian style fried rice with veggies", image: "🍛", categoryName: "Jollof" },
    { name: "Suya", price: 1200, description: "Spicy grilled beef skewers", image: "🍢", categoryName: "Meat/Fish" },
    { name: "Pepper Soup", price: 2000, description: "Spicy goat meat pepper soup", image: "🥣", categoryName: "Soups" },
    { name: "Chapman", price: 1500, description: "Fruity Nigerian cocktail", image: "🍹", categoryName: "Drinks" },
    { name: "Takeaway Pack", price: 200, description: "Plastic takeaway container", image: "🥡", categoryName: "Takeaway" }
];

const seedDB = async () => {
    try {
        console.log("Connecting to DB...");
        // Ensure we have a valid URI string
        const dbUri = config.databaseURI || process.env.MONGODB_URI || "mongodb://localhost:27017/pos-db";
        await mongoose.connect(dbUri);
        console.log(`Connected to ${dbUri}`);

        // Seed Categories
        console.log("Seeding Categories...");
        const categoryMap = {};
        for (const cat of categories) {
            let category = await Category.findOne({ name: cat.name });
            if (!category) {
                category = new Category(cat);
                await category.save();
                console.log(`Created category: ${cat.name}`);
            } else {
                console.log(`Category exists: ${cat.name}`);
            }
            categoryMap[cat.name] = category._id;
        }

        // Seed Dishes
        console.log("Seeding Dishes...");
        for (const dish of dishes) {
            const categoryId = categoryMap[dish.categoryName];
            if (!categoryId) {
                console.warn(`Category not found for dish: ${dish.name}`);
                continue;
            }

            const existingDish = await Dish.findOne({ name: dish.name });
            if (!existingDish) {
                const newDish = new Dish({
                    name: dish.name,
                    price: dish.price,
                    description: dish.description,
                    image: dish.image,
                    category: categoryId,
                    available: true
                });
                await newDish.save();
                console.log(`Created dish: ${dish.name}`);
            } else {
                console.log(`Dish exists: ${dish.name}`);
            }
        }

        console.log("Seeding complete!");

    } catch (error) {
        console.error("Seeding failed:", error);
    } finally {
        await mongoose.disconnect();
    }
};

seedDB();
