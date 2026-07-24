const express = require("express");
const router = express.Router({ mergeParams: true });               //For to use req.perams true mergeParams 
const User = require("../modals/user.js");
const wrapAsync = require("../utility/wrapAsync.js");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");

// SignUp 
router.get("/signup", (req, res) => {
    res.render("./users/signup.ejs");
});
router.post("/signup", wrapAsync(async (req, res, next) => {
    try {
        let { username, email, password } = req.body;
        const newUser = new User({ username, email });
        const registeredUser = await User.register(newUser, password);
        req.login(registeredUser, (err) => {              // inbuilt passport npm
            if (err) {
                return next(err);
            }
            req.flash("success", "welcome to the Wanderlust!");
            res.redirect(req.session.redirectUrl || "/listings");
        });
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }
}));

// Login
router.get("/login", (req, res) => {
    res.render("./users/login.ejs");
    // res.send("Working");
});

// middleware
const auth = passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true
})
router.post("/login", saveRedirectUrl, auth, wrapAsync(async (req, res) => {
    req.flash("success", "Welcome back to Wanderlust! You are logged in!");
    let redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
}));

// Logout
router.get("/logout", (req, res, next) => {
    req.logOut((err) => {                 //inbuilt pasport npms check doc
        if (err) {
            next(err);
        }
        req.flash("success", "you are logged out!");
        res.redirect("/listings");
    })
});

module.exports = router;