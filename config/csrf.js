const { doubleCsrf } = require("csrf-csrf");

const secret = process.env.SECRET || (process.env.NODE_ENV === "test" ? "test-csrf-secret" : undefined);

const {
    doubleCsrfProtection,
    generateCsrfToken,
    invalidCsrfTokenError
} = doubleCsrf({
    getSecret: () => secret,
    getSessionIdentifier: (req) => req.sessionID || "",
    cookieName: "x-csrf-token",
    cookieOptions: {
        sameSite: "lax",
        secure: process.env.COOKIE_SECURE === "true" || (process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false"),
        httpOnly: true,
        signed: false,
    },
    getCsrfTokenFromRequest: (req) => req.body?._csrf || req.query?._csrf || req.headers["x-csrf-token"],
});

module.exports = {
    doubleCsrfProtection,
    generateCsrfToken,
    invalidCsrfTokenError
};
