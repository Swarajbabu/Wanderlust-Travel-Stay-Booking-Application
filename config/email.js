const nodemailer = require("nodemailer");
const logger = require("./logger");

let transporter;

const isTest = process.env.NODE_ENV === "test";
const hasCredentials = process.env.SMTP_USER && process.env.SMTP_PASS;

if (!isTest && hasCredentials) {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: (process.env.SMTP_PORT === "465"),
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
} else {
    // Winston log stub for testing/unconfigured SMTP
    transporter = {
        sendMail: async (options) => {
            logger.info(`[EMAIL STUB] To: ${options.to} | Subject: ${options.subject}\nContent:\n${options.text}`);
            return { messageId: "stub-id-" + Date.now() };
        }
    };
}

module.exports = transporter;
