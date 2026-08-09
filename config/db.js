const mongoose = require("mongoose");
const logger = require("./logger");

const connectDB = async () => {
    try {
        const dbUrl = process.env.MONGODB_ATLAS;
        await mongoose.connect(dbUrl);
        logger.info("Connected to MongoDB database.");
    } catch (err) {
        logger.error("Failed to connect to MongoDB: " + err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
