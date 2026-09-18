require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
try {
    require("dns").setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
    // Ignore if not supported
}
const mongoose = require("mongoose");
const initData = require("./data");
const Listing = require("../modals/listing");
const User = require("../modals/user");
const Review = require("../modals/review");
const Booking = require("../modals/booking");
const logger = require("../config/logger");

const mongodb_url = process.env.MONGODB_ATLAS;

const initDB = async () => {
    try {
        await mongoose.connect(mongodb_url);
        logger.info("Connected to MongoDB for initialization: " + mongoose.connection.name);

        // 1. Wipe all existing data in the database
        logger.info("Purging existing database collections...");
        await Review.deleteMany({});
        await Booking.deleteMany({});
        await Listing.deleteMany({});
        await User.deleteMany({});
        logger.info("Successfully cleared Reviews, Bookings, Listings, and Users.");

        // 2. Create the Host user (Wonderlust_host)
        const hostUser = new User({
            username: "Wonderlust_host",
            email: "host@wanderlust.com",
            emailVerified: true
        });
        const registeredHost = await User.register(hostUser, "HostPass@2026");
        logger.info(`Created Wonderlust Host user: ${registeredHost.username} (ID: ${registeredHost._id})`);

        // 3. Create the Guest user (guest_user)
        const guestUser = new User({
            username: "guest_user",
            email: "guest@wanderlust.com",
            emailVerified: true
        });
        const registeredGuest = await User.register(guestUser, "GuestPass@2026");
        logger.info(`Created Guest user: ${registeredGuest.username} (ID: ${registeredGuest._id})`);

        // 4. Map the host user's ID to all listings and ensure schema compliance
        const listingsToInsert = initData.data.map((obj) => ({
            ...obj,
            owner: registeredHost._id,
            image: obj.image || (obj.images && obj.images[0]) || { url: "", filename: "listingimage" },
            images: obj.images && obj.images.length >= 5 ? obj.images : [
                obj.image,
                obj.image,
                obj.image,
                obj.image,
                obj.image
            ],
            reviews: [],
            country: obj.country || "India",
            geometry: obj.geometry || {
                type: "Point",
                coordinates: [78.4867, 17.3850]
            },
            category: obj.category || "Rooms"
        }));

        // 5. Insert seeded Indian listings
        const inserted = await Listing.insertMany(listingsToInsert);
        logger.info(`Data initialization complete! Seeded ${inserted.length} Indian destination listings into '${mongoose.connection.name}' database.`);
        logger.info(`All ${inserted.length} listings are owned by host '${registeredHost.username}' (${registeredHost._id}).`);
    } catch (err) {
        logger.error("Database initialization error: " + err.message);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
        logger.info("Database connection closed.");
    }
};

initDB();
