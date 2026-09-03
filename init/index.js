require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
require("dns").setServers(["8.8.8.8", "1.1.1.1"]);
const mongoose = require("mongoose");
const initData = require("./data");
const Listing = require("../modals/listing");
const User = require("../modals/user");
const logger = require("../config/logger");

const mongodb_url = process.env.MONGODB_ATLAS;

const initDB = async () => {
    try {
        await mongoose.connect(mongodb_url);
        logger.info("Connected to DB for initialization: " + mongoose.connection.name);

        // Ensure default owner user exists so listings have a valid host
        const defaultOwnerId = new mongoose.Types.ObjectId("6a7168412e5454037b86ffc5");
        let demoUser = await User.findById(defaultOwnerId);
        if (!demoUser) {
            demoUser = await User.findOne({ username: "wanderlust_admin" });
        }
        if (!demoUser) {
            demoUser = new User({
                _id: defaultOwnerId,
                username: "wanderlust_admin",
                email: "admin@wanderlust.com",
                emailVerified: true
            });
            await User.register(demoUser, "Admin@123");
            logger.info("Created default host user: wanderlust_admin");
        }

        await Listing.deleteMany({});
        const listingsToInsert = initData.data.map((obj) => ({
            ...obj,
            owner: demoUser._id,
            geometry: obj.geometry || {
                type: "Point",
                coordinates: [78.4867, 17.3850]
            },
            category: obj.category || "Rooms"
        }));

        const inserted = await Listing.insertMany(listingsToInsert);
        logger.info(`Data was initialized successfully! (${inserted.length} listings seeded into '${mongoose.connection.name}' database)`);
    } catch (err) {
        logger.error("Database initialization error: " + err.message);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
        logger.info("Database connection closed.");
    }
};

initDB();
