const createHttpError = require("http-errors");
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const User = require("../models/userModel");


const isVerifiedUser = async (req, res, next) => {
    try{
        // Try to get token from cookies first (for browser requests)
        let token = req.cookies?.accessToken;
        
        // If not in cookies, try Authorization header (for API requests)
        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.slice(7); // Remove 'Bearer ' prefix
            }
        }
        
        if(!token){
            const error = createHttpError(401, "Please provide token!");
            return next(error);
        }

        const decodeToken = jwt.verify(token, config.accessTokenSecret);

        const user = await User.findById(decodeToken._id);
        if(!user){
            const error = createHttpError(401, "User not exist!");
            return next(error);
        }

        req.user = user;
        next();

    }catch (error) {
        const err = createHttpError(401, "Invalid Token!");
        next(err);
    }
}

module.exports = { isVerifiedUser };