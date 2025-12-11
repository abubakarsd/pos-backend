const mongoose = require("mongoose");

const loginSessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    loginTime: {
        type: Date,
        default: Date.now,
        required: true
    },

    logoutTime: {
        type: Date,
        default: null
    },

    location: {
        type: String,
        default: 'Unknown'
    },

    ipAddress: {
        type: String,
        default: null
    },

    userAgent: {
        type: String,
        default: null
    },

    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model("LoginSession", loginSessionSchema);
