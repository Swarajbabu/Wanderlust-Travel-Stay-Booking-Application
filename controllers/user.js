const User = require("../modals/user.js");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const emailTransporter = require("../config/email");
const logger = require("../config/logger");
const ExpressError = require("../utility/ExpressError");

module.exports.renderSignupForm = (req, res) => {
    res.render("./users/signup.ejs");
};

module.exports.Signup = async (req, res, next) => {
    try {
        let { username, email, password } = req.body;
        const newUser = new User({ username, email, emailVerified: false });
        const registeredUser = await User.register(newUser, password);

        // Generate verification OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(otp, salt);

        registeredUser.otpHash = hash;
        registeredUser.otpExpiresAt = Date.now() + 600000; // 10 minutes
        await registeredUser.save();

        // Email OTP
        const mailOptions = {
            from: process.env.SMTP_FROM || "Wanderlust <no-reply@wanderlust.com>",
            to: registeredUser.email,
            subject: "Verify Your Email - Wanderlust",
            text: `Hello ${registeredUser.username},\n\nWelcome to Wanderlust! Please verify your email using the following OTP:\n\nOTP: ${otp}\n\nThis OTP is valid for 10 minutes.\n\nBest regards,\nThe Wanderlust Team`
        };
        await emailTransporter.sendMail(mailOptions);

        req.login(registeredUser, (err) => {
            if (err) {
                return next(err);
            }
            req.session.otpEmail = registeredUser.email;
            req.flash("success", "Welcome to Wanderlust! Please verify your email using the code sent to your inbox.");
            res.redirect("/login/otp/verify");
        });
    } catch (e) {
        if (e.code === 11000) {
            req.flash("error", "A user with that email is already registered.");
        } else {
            req.flash("error", e.message);
        }
        res.redirect("/signup");
    }
};

module.exports.renderLoginForm = (req, res) => {
    res.render("./users/login.ejs");
    // res.send("Working");
};

module.exports.login = async (req, res) => {
    req.flash("success", "Welcome back to Wanderlust! You are logged in!");
    let redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
};

module.exports.logout =  (req, res, next) => {
    req.logOut((err) => {                 //inbuilt pasport npms check doc
        if (err) {
            next(err);
        }
        req.flash("success", "you are logged out!");
        res.redirect("/listings");
    })
};

module.exports.renderForgotForm = (req, res) => {
    res.render("./users/forgot.ejs");
};

module.exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        req.flash("error", "No account with that email address exists.");
        return res.redirect("/forgot-password");
    }

    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiry
    await user.save();

    const resetUrl = `${req.protocol}://${req.get("host")}/reset-password/${token}`;
    const mailOptions = {
        from: process.env.SMTP_FROM || "Wanderlust <no-reply@wanderlust.com>",
        to: user.email,
        subject: "Wanderlust Password Reset Request",
        text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n` +
              `Please click on the following link, or paste this into your browser to complete the process within 1 hour:\n\n` +
              `${resetUrl}\n\n` +
              `If you did not request this, please ignore this email and your password will remain unchanged.\n`
    };

    try {
        await emailTransporter.sendMail(mailOptions);
        req.flash("success", `An email has been sent to ${user.email} with reset instructions.`);
    } catch (err) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        logger.error(`Error sending reset password email: ${err.message}`);
        req.flash("error", "Failed to send password reset email. Please try again later.");
    }

    res.redirect("/login");
};

module.exports.renderResetForm = async (req, res) => {
    const { token } = req.params;
    const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        req.flash("error", "Password reset token is invalid or has expired.");
        return res.redirect("/forgot-password");
    }

    res.render("./users/reset.ejs", { token });
};

module.exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        req.flash("error", "Password reset token is invalid or has expired.");
        return res.redirect("/forgot-password");
    }

    await user.setPassword(password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const mailOptions = {
        from: process.env.SMTP_FROM || "Wanderlust <no-reply@wanderlust.com>",
        to: user.email,
        subject: "Your Wanderlust Password Has Been Reset",
        text: `Hello,\n\nThis is a confirmation that the password for your Wanderlust account (${user.email}) has just been changed.\n`
    };

    try {
        await emailTransporter.sendMail(mailOptions);
    } catch (err) {
        logger.error(`Error sending password reset confirmation email: ${err.message}`);
    }

    req.flash("success", "Success! Your password has been changed.");
    res.redirect("/login");
};

module.exports.googleCallback = async (req, res) => {
    let redirectUrl = req.session.redirectUrl || "/listings";
    delete req.session.redirectUrl;
    res.redirect(redirectUrl);
};