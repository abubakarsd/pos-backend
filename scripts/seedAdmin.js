const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const Role = require("../models/roleModel");
const config = require("../config/config");
const connectDB = require("../config/database");

// Connect to DB
connectDB();

const seedAdmin = async () => {
    try {
        // 1. Create Admin Role
        const adminRoleName = "Admin";
        let adminRole = await Role.findOne({ name: adminRoleName });

        if (!adminRole) {
            adminRole = new Role({
                name: adminRoleName,
                permissions: ["settings_access", "dashboard_access", "manage_users", "manage_menu"]
            });
            await adminRole.save();
            console.log("✅ Admin Role created with permissions.");
        } else {
            console.log("ℹ️ Admin Role already exists.");
        }

        // 2. Create Admin User
        const adminEmail = "admin@pos.com";
        const adminPassword = "password123"; // Change this in production!
        const adminPhone = "1234567890";

        let adminUser = await User.findOne({ email: adminEmail });

        if (!adminUser) {
            // Hash password manually here since we might bypass the pre-save hook depending on implementation, 
            // but the userModel has a pre-save hook. Let's rely on that or do it explicitly to be safe if creating via Mongoose model.
            // Actually, the User model has a pre-save hook for hashing.

            adminUser = new User({
                name: "Super Admin",
                email: adminEmail,
                phone: adminPhone,
                password: adminPassword, // Pre-save hook will hash this
                role: adminRoleName // Keeping role as string for frontend compatibility
            });

            await adminUser.save();
            console.log(`✅ Admin User created: ${adminEmail} / ${adminPassword}`);
        } else {
            console.log("ℹ️ Admin User already exists.");
        }

        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding admin:", error);
        process.exit(1);
    }
};

seedAdmin();
