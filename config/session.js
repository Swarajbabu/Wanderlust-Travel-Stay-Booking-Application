const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const mongoose = require("mongoose");
const logger = require("./logger");

const secret = process.env.SECRET;

const store = MongoStore.create({
    clientPromise: mongoose.connection.asPromise().then(() => mongoose.connection.getClient()),
    crypto: {
        secret: secret,
    },
    touchAfter: 24 * 60 * 60
});

store.on("error", (err) => {
    logger.error("ERROR IN MONGO SESSION STORE: " + err.message);
});

const isProduction = process.env.NODE_ENV === "production";
const cookieSecure = process.env.COOKIE_SECURE === "true" || (isProduction && process.env.COOKIE_SECURE !== "false");

const sessionOptions = {
    store,
    secret: secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: cookieSecure
    }
};

module.exports = session(sessionOptions);
