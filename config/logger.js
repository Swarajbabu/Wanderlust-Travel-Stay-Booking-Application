// Configuration for Winston Logging Library
// this used for the logging the errors and other information
// Where it is Used: In app.js file

const winston = require("winston");

const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        process.env.NODE_ENV === "production"
            ? winston.format.json()
            : winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message }) => {
                    return `[${timestamp}] ${level}: ${message}`;
                })
              )
    ),
    transports: [
        new winston.transports.Console()
    ]
});

module.exports = logger;
