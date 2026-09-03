const User = require("../modals/user");
const bcrypt = require("bcrypt");
const emailTransporter = require("../config/email");
const logger = require("../config/logger");

module.exports.renderRequestForm = (req, res) => {
    res.render("./users/otp_request.ejs", { title: "Request OTP" });
};

module.exports.requestOtp = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        req.flash("error", "Email is required.");
        return res.redirect("/login/otp/request");
    }

    const genericMessage = "If that email exists, a verification code has been sent.";

    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(otp, salt);

            user.otpHash = hash;
            user.otpExpiresAt = Date.now() + 600000; // 10 minutes
            await user.save();

            const mailOptions = {
                from: process.env.SMTP_FROM || "Wanderlust <no-reply@wanderlust.com>",
                to: user.email,
                subject: "Your Wanderlust One-Time Password (OTP)",
                text: `Hello ${user.username},\n\nYour One-Time Password (OTP) for Wanderlust is: ${otp}\n\nThis OTP is valid for 10 minutes and can only be used once.\n\nBest regards,\nThe Wanderlust Team`
            };

            await emailTransporter.sendMail(mailOptions);
            logger.info(`OTP email sent to user ${user.email}`);
        } else {
            logger.info(`OTP requested for unregistered email: ${email}`);
        }
    } catch (err) {
        logger.error(`Error requesting OTP: ${err.message}`);
    }

    req.flash("success", genericMessage);
    req.session.otpEmail = email.toLowerCase();
    res.redirect("/login/otp/verify");
};

module.exports.renderVerifyForm = (req, res) => {
    const email = req.session.otpEmail || "";
    res.render("./users/otp_verify.ejs", { email, title: "Verify OTP" });
};

module.exports.verifyOtp = async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) {
        req.flash("error", "Email and OTP code are required.");
        return res.redirect("/login/otp/verify");
    }

    const genericError = "Invalid or expired verification code.";

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.otpHash || !user.otpExpiresAt) {
        req.flash("error", genericError);
        return res.redirect("/login/otp/verify");
    }

    if (Date.now() > user.otpExpiresAt) {
        user.otpHash = undefined;
        user.otpExpiresAt = undefined;
        await user.save();
        req.flash("error", genericError);
        return res.redirect("/login/otp/verify");
    }

    const isMatch = await bcrypt.compare(code, user.otpHash);
    if (!isMatch) {
        req.flash("error", genericError);
        return res.redirect("/login/otp/verify");
    }

    user.otpHash = undefined;
    user.otpExpiresAt = undefined;
    
    const wasUnverified = !user.emailVerified;
    user.emailVerified = true;
    
    await user.save();

    req.login(user, (err) => {
        if (err) {
            logger.error(`Error logging in user via OTP: ${err.message}`);
            req.flash("error", "Error logging in user. Please try again.");
            return res.redirect("/login");
        }
        
        delete req.session.otpEmail;
        if (wasUnverified) {
            req.flash("success", "Email successfully verified! Welcome to Wanderlust.");
        } else {
            req.flash("success", "Successfully logged in via OTP!");
        }
        res.redirect("/listings");
    });
};
