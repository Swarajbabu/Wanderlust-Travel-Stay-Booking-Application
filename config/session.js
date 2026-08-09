const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const logger = require("./logger");

const secret = process.env.SECRET;
const mongodb_url = process.env.MONGODB_ATLAS;

const store = MongoStore.create({
    mongoUrl: mongodb_url,
    crypto: {
        secret: secret,
    },
    touchAfter: 24 * 60 * 60
});

store.on("error", (err) => {
    logger.error("ERROR IN MONGO SESSION STORE: " + err.message);
});

const sessionOptions = {
    store,
    secret: secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    }
};

module.exports = session(sessionOptions);
