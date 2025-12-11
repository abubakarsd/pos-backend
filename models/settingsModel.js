const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
    // Business Information
    businessName: {
        type: String,
        required: true,
        default: "Restaurant Name"
    },
    businessLogo: {
        type: String,
        default: null
    },
    businessAddress: {
        type: String,
        default: ""
    },
    businessPhone: {
        type: String,
        default: ""
    },
    businessEmail: {
        type: String,
        default: ""
    },

    // Tax & VAT Settings
    vatRate: {
        type: Number,
        default: 7.5,
        min: 0,
        max: 100
    },
    includeVatInPrices: {
        type: Boolean,
        default: true
    },
    showVatOnReceipt: {
        type: Boolean,
        default: true
    },
    taxRegistrationNumber: {
        type: String,
        default: ""
    },

    // Printer Settings
    receiptPrinter: {
        type: String,
        default: "Epson TM-T88V"
    },
    kitchenPrinter: {
        type: String,
        default: "Epson TM-T88V (Kitchen)"
    },
    autoPrintKitchenOrders: {
        type: Boolean,
        default: true
    },
    printCustomerReceipt: {
        type: Boolean,
        default: true
    },

}, { timestamps: true });

module.exports = mongoose.model("Settings", settingsSchema);
