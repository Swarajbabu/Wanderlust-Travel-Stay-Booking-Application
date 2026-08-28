const LocalStrategy = require("passport-local");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../modals/user");

function configurePassport(passport) {
    passport.use(new LocalStrategy(User.authenticate()));

    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback",
        passReqToCallback: true,
        proxy: true
    },
    async function(req, accessToken, refreshToken, profile, done) {
        try {
            // 1. Look up User by googleId first
            let user = await User.findOne({ googleId: profile.id });
            if (user) {
                return done(null, user);
            }

            // 2. Look up by matching email (to link account)
            const email = profile.emails && profile.emails[0] && profile.emails[0].value;
            if (email) {
                user = await User.findOne({ email: email.toLowerCase() });
                if (user) {
                    user.googleId = profile.id;
                    user.authProvider = "google";
                    user.emailVerified = true;
                    await user.save();
                    req.flash("success", "Successfully linked your Google account!");
                    return done(null, user);
                }
            }

            // 3. Create a brand-new User
            let username = profile.displayName || (email && email.split("@")[0]);
            if (!username) {
                username = "google_user_" + profile.id.substring(0, 6);
            }
            username = username.toLowerCase().replace(/[^a-z0-9]/g, "_");

            let existingUsername = await User.findOne({ username });
            if (existingUsername) {
                username = username + "_" + Math.floor(Math.random() * 10000);
            }

            const newUser = new User({
                username,
                email: email ? email.toLowerCase() : `google_${profile.id}@example.com`,
                googleId: profile.id,
                authProvider: "google",
                emailVerified: true
            });

            await newUser.save();
            req.flash("success", "Welcome to Wanderlust! Registered via Google.");
            return done(null, newUser);
        } catch (err) {
            return done(err);
        }
    }));

    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());
}

module.exports = configurePassport;
