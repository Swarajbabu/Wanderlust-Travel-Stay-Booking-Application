const mongoose = require("mongoose");
const logger = require("./logger");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDB = async (retries = 5, delay = 2000) => {
    const dbUrl = process.env.MONGODB_ATLAS;
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await mongoose.connect(dbUrl, {
                serverSelectionTimeoutMS: 15000,
            });
            logger.info("Connected to MongoDB database.");
            return;
        } catch (err) {
            logger.warn(`MongoDB connection attempt ${attempt}/${retries} failed: ${err.message}`);
            if (attempt === retries) {
                logger.error("All MongoDB connection attempts exhausted: " + err.message);
                process.exit(1);
            }
            logger.info(`Retrying MongoDB connection in ${delay / 1000}s...`);
            await sleep(delay);
        }
    }
};

module.exports = connectDB;
