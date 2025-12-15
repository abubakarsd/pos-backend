const User = require("../models/userModel");
const Dish = require("../models/dishModel");

exports.getDashboardStats = async (req, res, next) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalMenu = await Dish.countDocuments();

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalMenu
            }
        });
    } catch (error) {
        next(error);
    }
};
