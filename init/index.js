require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
require("dns").setServers(["8.8.8.8", "1.1.1.1"]);
const mongoose = require("mongoose");
const initData = require("./data");
const Listing = require("../modals/listing");
const logger = require("../config/logger");

let mongodb_url = process.env.MONGODB_ATLAS;
mongoose.connect(mongodb_url)
    .then((res) => {
        logger.info("Connected to DB for initialization");
    }).catch((err) => {
        logger.error("Database connection error in init: " + err.message);
    });

const initDB = async () => {
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj) => ({
        ...obj,
        owner: "6a7168412e5454037b86ffc5",
        geometry: obj.geometry || {
            type: "Point",
            coordinates: [78.4867, 17.3850]
        },
        category: obj.category || "Rooms"
    }));
    await Listing.insertMany(initData.data);
    logger.info("Data was initialized successfully!");
    mongoose.connection.close();
};

initDB();
