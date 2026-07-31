const express = require("express");
const router = express.Router({ mergeParams: true });               //For to use req.perams true mergeParams 
const wrapAsync = require("../utility/wrapAsync.js");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");

const userController = require("../controllers/user.js");

// SignUp 
router.route("/signup")
    .get(userController.renderSignupForm)               // Showing signup form
    .post(wrapAsync(userController.Signup));            // signup


// middleware
const auth = passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true
})
// Login
router.route("/login")
    .get(userController.renderLoginForm)
    .post(saveRedirectUrl, auth, wrapAsync(userController.login));

// Logout
router.get("/logout", userController.logout);

module.exports = router;