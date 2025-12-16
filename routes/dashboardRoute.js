const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");

router.get("/", dashboardController.getDashboardStats);
router.get("/analytics", dashboardController.getAnalyticsStats);

module.exports = router;
