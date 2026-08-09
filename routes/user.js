const express = require("express");
const router = express.Router({ mergeParams: true });               //For to use req.perams true mergeParams 
const wrapAsync = require("../utility/wrapAsync.js");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");
const rateLimit = require("express-rate-limit");

const userController = require("../controllers/user.js");
const otpController = require("../controllers/otp.js");

const authLimiter = process.env.NODE_ENV === "test"
    ? (req, res, next) => next()
    : rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        limit: 10, // Limit each IP to 10 requests per 15 minutes
        handler: (req, res, next, options) => {
            req.flash("error", "Too many authentication attempts. Please try again after 15 minutes.");
            res.redirect(req.originalUrl);
        }
    });

const otpLimiter = process.env.NODE_ENV === "test"
    ? (req, res, next) => next()
    : rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        limit: 5, // Limit to 5 requests per 15 minutes
        keyGenerator: (req) => {
            const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            const email = req.body && req.body.email ? req.body.email.toLowerCase() : "";
            return `${ip}_${email}`;
        },
        validate: { keyGeneratorIpFallback: false },
        handler: (req, res, next, options) => {
            req.flash("error", "Too many OTP attempts. Please try again after 15 minutes.");
            res.redirect(req.originalUrl || "/login");
        }
    });

// SignUp 
router.route("/signup")
    .get(userController.renderSignupForm)               // Showing signup form
    .post(authLimiter, wrapAsync(userController.Signup));            // signup


// middleware
const auth = passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true
})
// Login
router.route("/login")
    .get(userController.renderLoginForm)
    .post(saveRedirectUrl, authLimiter, auth, wrapAsync(userController.login));

// Logout
router.get("/logout", userController.logout);

// Forgot Password
router.route("/forgot-password")
    .get(userController.renderForgotForm)
    .post(wrapAsync(userController.forgotPassword));

// Reset Password
router.route("/reset-password/:token")
    .get(wrapAsync(userController.renderResetForm))
    .post(wrapAsync(userController.resetPassword));

// Google OAuth
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login", failureFlash: true }),
    userController.googleCallback
);

// OTP Login / Email Verification
router.route("/login/otp/request")
    .get(otpController.renderRequestForm)
    .post(otpLimiter, wrapAsync(otpController.requestOtp));

router.route("/login/otp/verify")
    .get(otpController.renderVerifyForm)
    .post(otpLimiter, wrapAsync(otpController.verifyOtp));

module.exports = router;