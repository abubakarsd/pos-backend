const createHttpError = require("http-errors");
const User = require("../models/userModel");
const LoginSession = require("../models/loginSessionModel");
const Role = require("../models/roleModel"); // Import Role model
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config/config");

const register = async (req, res, next) => {
    try {
        const { name, phone, email, password, role } = req.body;

        if (!name || !phone || !email || !password || !role) {
            const error = createHttpError(400, "All fields are required!");
            return next(error);
        }

        const isUserPresent = await User.findOne({ email });
        if (isUserPresent) {
            const error = createHttpError(400, "User already exists!");
            return next(error);
        }

        const roleExists = await Role.findById(role);
        if (!roleExists) {
            const error = createHttpError(400, "Invalid role provided!");
            return next(error);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = { name, phone, email, password: hashedPassword, role };
        const newUser = User(user);
        await newUser.save();

        const populatedUser = await newUser.populate('role');

        res.status(201).json({ success: true, message: "New user created!", data: populatedUser });
    } catch (error) {
        next(error);
    }
}


const login = async (req, res, next) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            const error = createHttpError(400, "All fields are required!");
            return next(error);
        }

        const isUserPresent = await User.findOne({ email }).populate('role');
        if (!isUserPresent) {
            const error = createHttpError(401, "Invalid Credentials");
            return next(error);
        }

        const isMatch = await bcrypt.compare(password, isUserPresent.password);
        if (!isMatch) {
            const error = createHttpError(401, "Invalid Credentials");
            return next(error);
        }

        // Token expires in 7 days
        const accessToken = jwt.sign({ _id: isUserPresent._id }, config.accessTokenSecret, {
            expiresIn: '7d'
        });

        // Get location from IP (or from request headers if available)
        const location = req.headers['x-location'] || 'Unknown Location';
        const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Unknown';
        const userAgent = req.headers['user-agent'] || 'Unknown';

        // Create login session record
        const loginSession = new LoginSession({
            user: isUserPresent._id,
            loginTime: new Date(),
            location: location,
            ipAddress: ipAddress,
            userAgent: userAgent,
            isActive: true
        });
        await loginSession.save();

        // Update user's last login info
        await User.findByIdAndUpdate(
            isUserPresent._id,
            {
                lastLogin: new Date(),
                lastLoginLocation: location
            }
        );

        res.cookie('accessToken', accessToken, {
            maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
            httpOnly: true,
            sameSite: 'none',
            secure: true
        })

        res.status(200).json({
            success: true, message: "User login successfully!",
            data: {
                _id: isUserPresent._id,
                name: isUserPresent.name,
                email: isUserPresent.email,
                phone: isUserPresent.phone,
                role: isUserPresent.role,
                isActive: isUserPresent.isActive,
                lastLogin: new Date(),
                lastLoginLocation: location,
                createdAt: isUserPresent.createdAt
            },
            token: accessToken
        });


    } catch (error) {
        next(error);
    }

}

const getUserData = async (req, res, next) => {
    try {

        const user = await User.findById(req.user._id).populate('role');
        res.status(200).json({ success: true, data: user });

    } catch (error) {
        next(error);
    }
}

const logout = async (req, res, next) => {
    try {
        // End the active login session
        await LoginSession.findOneAndUpdate(
            { user: req.user._id, isActive: true },
            {
                logoutTime: new Date(),
                isActive: false
            },
            { sort: { loginTime: -1 } }
        );

        // Update user's last logout time
        await User.findByIdAndUpdate(
            req.user._id,
            { lastLogout: new Date() }
        );

        res.clearCookie('accessToken');
        res.status(200).json({ success: true, message: "User logout successfully!" });

    } catch (error) {
        next(error);
    }
}

const getUserSessions = async (req, res, next) => {
    try {
        const { id } = req.params;

        const sessions = await LoginSession.find({ user: id })
            .sort({ loginTime: -1 })
            .limit(10);

        res.status(200).json({ success: true, data: sessions });
    } catch (error) {
        next(error);
    }
}

const getUserActivityDetails = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id).populate('role').select('-password');
        if (!user) {
            return next(createHttpError(404, "User not found!"));
        }

        const sessions = await LoginSession.find({ user: id })
            .sort({ loginTime: -1 });

        res.status(200).json({
            success: true,
            data: {
                user,
                sessions
            }
        });
    } catch (error) {
        next(error);
    }
}

const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find().populate('role').select('-password');
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        next(error);
    }
}

const updateUserStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        if (typeof isActive !== 'boolean') {
            return next(createHttpError(400, "isActive must be a boolean!"));
        }

        const user = await User.findByIdAndUpdate(
            id,
            { isActive },
            { new: true }
        ).populate('role');

        if (!user) {
            return next(createHttpError(404, "User not found!"));
        }

        res.status(200).json({ success: true, message: "User status updated!", data: user });
    } catch (error) {
        next(error);
    }
}

const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return next(createHttpError(404, "User not found!"));
        }

        res.status(200).json({ success: true, message: "User deleted successfully!" });
    } catch (error) {
        next(error);
    }
}

const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, phone, role, isActive, password } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;
        if (role) updateData.role = role;
        if (typeof isActive !== 'undefined') updateData.isActive = isActive;

        // Handle password update if provided
        if (password && password.trim() !== "") {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateData.password = hashedPassword;
        }

        const user = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('role');

        if (!user) {
            return next(createHttpError(404, "User not found!"));
        }

        res.status(200).json({ success: true, message: "User updated successfully!", data: user });
    } catch (error) {
        next(error);
    }
}




module.exports = { register, login, getUserData, logout, getAllUsers, updateUserStatus, deleteUser, getUserSessions, getUserActivityDetails, updateUser }