const express = require("express");
const router = express.Router();
const wrapAsync = require("../utility/wrapAsync");
const { isLoggedIn } = require("../middleware.js");
const hostController = require("../controllers/host.js");

router.get("/dashboard", isLoggedIn, wrapAsync(hostController.renderDashboard));

module.exports = router;
