const User = require("../modals/user.js");
const Listing = require("../modals/listing.js");
const Booking = require("../modals/booking.js");
const mongoose = require("mongoose");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const emailTransporter = require("../config/email");
const logger = require("../config/logger");

module.exports.renderSignupForm = (req, res) => {
    res.render("./users/signup.ejs", { title: "Sign Up" });
};

module.exports.Signup = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        const normalizedEmail = (email || "").toLowerCase().trim();
        const newUser = new User({ username, email: normalizedEmail, emailVerified: false });
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
            req.flash("error", "A user with that email or username is already registered.");
        } else {
            req.flash("error", e.message);
        }
        res.redirect("/signup");
    }
};

module.exports.renderLoginForm = (req, res) => {
    res.render("./users/login.ejs", { title: "Log In" });
};

module.exports.login = async (req, res) => {
    req.flash("success", "Welcome back to Wanderlust! You are logged in!");
    const redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
    req.logOut((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "you are logged out!");
        res.redirect("/listings");
    });
};

module.exports.renderForgotForm = (req, res) => {
    res.render("./users/forgot.ejs", { title: "Forgot Password" });
};

module.exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    const normalizedEmail = (email || "").toLowerCase().trim();
    const genericMsg = "If an account with that email address exists, password reset instructions have been sent.";
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
        req.flash("success", genericMsg);
        return res.redirect("/login");
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
        req.flash("success", genericMsg);
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

    res.render("./users/reset.ejs", { token, title: "Reset Password" });
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
    const redirectUrl = req.session.redirectUrl || "/listings";
    delete req.session.redirectUrl;
    res.redirect(redirectUrl);
};

module.exports.guestLogin = async (req, res, next) => {
    try {
        let guestUser = await User.findOne({ username: "guest_user" });
        if (!guestUser) {
            guestUser = new User({
                username: "guest_user",
                email: "guest@wanderlust.com",
                emailVerified: true,
                role: "user"
            });
            await User.register(guestUser, process.env.DEMO_GUEST_PASSWORD || "GuestPass@2026");
            logger.info("Created guest demo user: guest_user");
        } else if (!guestUser.emailVerified) {
            guestUser.emailVerified = true;
            await guestUser.save();
        }

        req.login(guestUser, (err) => {
            if (err) {
                return next(err);
            }
            req.flash("success", "Welcome, Guest Evaluator! You can explore, book stays, and test the platform.");
            const redirectUrl = req.session.redirectUrl || "/listings";
            delete req.session.redirectUrl;
            res.redirect(redirectUrl);
        });
    } catch (err) {
        logger.error("Guest login error: " + err.message);
        req.flash("error", "Unable to complete guest login. Please try again.");
        res.redirect("/login");
    }
};

module.exports.toggleWishlist = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid listing ID" });
    }
    const listingExists = await Listing.exists({ _id: id });
    if (!listingExists) {
        return res.status(404).json({ error: "Listing not found" });
    }

    const user = await User.findById(req.user._id);
    const alreadySaved = (user.wishlist || []).some((wId) => wId.equals(id));
    if (alreadySaved) {
        await User.findByIdAndUpdate(req.user._id, { $pull: { wishlist: id } });
    } else {
        await User.findByIdAndUpdate(req.user._id, { $addToSet: { wishlist: id } });
    }

    const updated = await User.findById(req.user._id).select("wishlist");
    res.json({
        saved: !alreadySaved,
        count: updated && updated.wishlist ? updated.wishlist.length : 0
    });
};

module.exports.renderWishlist = async (req, res) => {
    const user = await User.findById(req.user._id).populate("wishlist");
    const savedListings = (user && user.wishlist ? user.wishlist : []).filter(Boolean);
    res.render("./users/wishlist.ejs", { savedListings, title: "Saved Stays" });
};

module.exports.renderProfile = async (req, res) => {
    const [listingCount, bookingCount] = await Promise.all([
        Listing.countDocuments({ owner: req.user._id }),
        Booking.countDocuments({ guest: req.user._id })
    ]);
    res.render("./users/profile.ejs", {
        profileUser: req.user,
        listingCount,
        bookingCount,
        title: "My Profile"
    });
};

module.exports.updateProfile = async (req, res) => {
    const {
        bio,
        phone,
        currentPassword,
        newPassword,
        gender,
        preferredCompanionGender,
        travelStyle,
        sleepSchedule,
        smokingPreference,
        interests,
        languages
    } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
        req.flash("error", "User not found.");
        return res.redirect("/login");
    }

    user.bio = typeof bio === "string" ? bio.trim().slice(0, 300) : user.bio;
    user.phone = typeof phone === "string" ? phone.trim().slice(0, 30) : user.phone;

    if (req.body._travelProfileSubmitted) {
        const cleanInterests = Array.isArray(interests)
            ? interests.map((s) => String(s).trim()).filter(Boolean)
            : (typeof interests === "string" && interests.trim() ? [interests.trim()] : []);
        const cleanLanguages = typeof languages === "string"
            ? languages.split(",").map((s) => s.trim()).filter(Boolean)
            : (Array.isArray(languages) ? languages.filter(Boolean) : ["English"]);

        user.travelProfile = {
            gender: ["prefer_not_to_say", "male", "female", "non_binary"].includes(gender) ? gender : "prefer_not_to_say",
            preferredCompanionGender: ["any", "same_gender"].includes(preferredCompanionGender) ? preferredCompanionGender : "any",
            travelStyle: ["budget", "balanced", "comfort", "adventure"].includes(travelStyle) ? travelStyle : "balanced",
            sleepSchedule: ["early_bird", "night_owl", "flexible"].includes(sleepSchedule) ? sleepSchedule : "flexible",
            smokingPreference: ["non_smoker", "smoker", "no_preference"].includes(smokingPreference) ? smokingPreference : "no_preference",
            interests: cleanInterests.slice(0, 10),
            languages: cleanLanguages.length > 0 ? cleanLanguages.slice(0, 6) : ["English"]
        };
    }

    await user.save();

    if (currentPassword && newPassword) {
        if (newPassword.length < 6) {
            req.flash("error", "New password must be at least 6 characters long.");
            return res.redirect("/profile");
        }
        try {
            await user.changePassword(currentPassword, newPassword);
            await user.save();
        } catch (err) {
            req.flash("error", "Current password is incorrect or password change failed.");
            return res.redirect("/profile");
        }
    }

    req.flash("success", "Profile updated successfully!");
    res.redirect("/profile");
};
