// Reload environment configuration
const overrideEnv = process.env.NODE_ENV !== "test";
require("dotenv").config({ override: overrideEnv });
if (process.env.NODE_ENV !== "test") {
    const validateEnv = require("./config/validateEnv");
    validateEnv();
}

// DNS set servers for development
if (process.env.NODE_ENV !== "production") {
    require("dns").setServers(["8.8.8.8", "1.1.1.1"]);
}

const express = require("express");
const app = express();
const path = require("path");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");
const passport = require("passport");
const morgan = require("morgan");
const helmet = require("helmet");
const compression = require("compression");

// Logger & DB Connection
const logger = require("./config/logger");
const connectDB = require("./config/db");
if (require.main === module) {
    connectDB();
}

// Passport & Session configuration imports
const sessionMiddleware = require("./config/session");
const configurePassport = require("./config/passport");

// Custom Error Class
const ExpressError = require("./utility/ExpressError.js");

// Router requires
const router_listing = require("./routes/listing.js");
const router_reviews = require("./routes/review.js");
const router_user = require("./routes/user.js");
const router_bookings = require("./routes/booking.js");

// CSRF Protection Setup
// Means: CSRF protection setup by csrf-csrf library
// Explanation CSRF: Cross Site Request Forgery.
// Purpose: to prevent unauthorized state-changing requests.
// How: 
//
const secret = process.env.SECRET;
const { doubleCsrf } = require("csrf-csrf");
const {
    doubleCsrfProtection,
    generateCsrfToken,
    invalidCsrfTokenError
} = doubleCsrf({
    getSecret: () => secret,
    getSessionIdentifier: (req) => "",
    cookieName: "x-csrf-token",
    cookieOptions: {
        sameSite: "lax",
        secure: false, // set to true in production if using HTTPS
        httpOnly: true,
        signed: false,
    },
    getCsrfTokenFromRequest: (req) => req.body?._csrf || req.query?._csrf || req.headers["x-csrf-token"],
});

// View Engine & Static Files configuration
app.set("trust proxy", 1);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.engine("ejs", ejsMate);

// HTTP Logging Middleware piped through Winston
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev", {
    stream: { write: (message) => logger.info(message.trim()) }
}));

// Compression & Helmet Middleware
app.use(compression());
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", "https://api.mapbox.com", "https://*.tiles.mapbox.com", "https://events.mapbox.com", "https://api.razorpay.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://api.mapbox.com", "https://cdn.jsdelivr.net", "https://checkout.razorpay.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://api.mapbox.com", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            workerSrc: ["'self'", "blob:"],
            childSrc: ["'self'", "blob:", "https://api.razorpay.com"],
            frameSrc: ["'self'", "https://api.razorpay.com"],
            objectSrc: [],
            imgSrc: ["'self'", "blob:", "data:", "https://res.cloudinary.com", "https://images.unsplash.com", "https://api.mapbox.com", "https://*.tiles.mapbox.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));
app.use(cookieParser(secret));
app.use(sessionMiddleware);
app.use(flash());
app.use((req, res, next) => {
    if (process.env.NODE_ENV === "test") {
        return next();
    }
    doubleCsrfProtection(req, res, next);
});

// Passport Configuration
app.use(passport.initialize());
app.use(passport.session());
configurePassport(passport);

// Expose flash messages, CSRF tokens, and current user to locals
app.use((req, res, next) => {
    res.locals.csrfToken = process.env.NODE_ENV === "test" ? "mock-csrf-token" : generateCsrfToken(req, res);
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user || null;
    next();
});

// Root route redirect
app.get("/", (req, res) => {
    res.redirect("/listings");
});

// Route mountings
app.use("/listings", router_listing);
app.use("/listings/:id/reviews", router_reviews);
app.use("/", router_bookings);
app.use("/", router_user);

// 404 handler
app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found"));
});

// CSRF Error Handler
app.use((err, req, res, next) => {
    if (err === invalidCsrfTokenError) {
        logger.warn(`CSRF FAILED! sessionID: ${req.sessionID} cookies: ${JSON.stringify(req.cookies)}`);
        req.flash("error", "Session expired or invalid CSRF token. Please try again.");
        return res.redirect(req.get("Referrer") || "/listings");
    }
    next(err);
});

// General Error Handler
app.use((err, req, res, next) => {
    let { statusCode = 500 } = err;
    logger.error(`Error ${statusCode}: ${err.message}\n${err.stack}`);
    res.status(statusCode).render("error.ejs", { err });
});

module.exports = app;

if (require.main === module) {
    const port = process.env.PORT || 8080;
    app.listen(port, () => {
        logger.info(`Server Started in: ${port}`);
    });
}
