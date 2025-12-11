const createHttpError = require("http-errors");
const Settings = require("../models/settingsModel");

const getSettings = async (req, res, next) => {
    try {
        let settings = await Settings.findOne();

        // If no settings exist, create default ones
        if (!settings) {
            settings = new Settings({});
            await settings.save();
        }

        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        next(error);
    }
};

const updateSettings = async (req, res, next) => {
    try {
        const {
            businessName,
            businessLogo,
            businessAddress,
            businessPhone,
            businessEmail,
            vatRate,
            includeVatInPrices,
            showVatOnReceipt,
            taxRegistrationNumber,
            receiptPrinter,
            kitchenPrinter,
            autoPrintKitchenOrders,
            printCustomerReceipt
        } = req.body;

        let settings = await Settings.findOne();

        // If no settings exist, create them
        if (!settings) {
            settings = new Settings();
        }

        // Update fields if provided
        if (businessName !== undefined) settings.businessName = businessName;
        if (businessLogo !== undefined) settings.businessLogo = businessLogo;
        if (businessAddress !== undefined) settings.businessAddress = businessAddress;
        if (businessPhone !== undefined) settings.businessPhone = businessPhone;
        if (businessEmail !== undefined) settings.businessEmail = businessEmail;
        if (vatRate !== undefined) settings.vatRate = vatRate;
        if (includeVatInPrices !== undefined) settings.includeVatInPrices = includeVatInPrices;
        if (showVatOnReceipt !== undefined) settings.showVatOnReceipt = showVatOnReceipt;
        if (taxRegistrationNumber !== undefined) settings.taxRegistrationNumber = taxRegistrationNumber;
        if (receiptPrinter !== undefined) settings.receiptPrinter = receiptPrinter;
        if (kitchenPrinter !== undefined) settings.kitchenPrinter = kitchenPrinter;
        if (autoPrintKitchenOrders !== undefined) settings.autoPrintKitchenOrders = autoPrintKitchenOrders;
        if (printCustomerReceipt !== undefined) settings.printCustomerReceipt = printCustomerReceipt;

        await settings.save();

        res.status(200).json({ success: true, message: "Settings updated successfully!", data: settings });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSettings,
    updateSettings,
};
