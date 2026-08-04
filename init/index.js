require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
require("dns").setServers(["8.8.8.8", "1.1.1.1"]);
const mongoose = require("mongoose");
const initData = require("./data");
const Listing = require("../modals/listing");

let mongodb_url = process.env.MONGODB_ATLAS;
mongoose.connect(mongodb_url)
    .then((res) => {
        console.log("Connected to DB for initialization");
    }).catch((err) => {
        console.log(err);
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
    console.log("Data was initialized successfully!");
    mongoose.connection.close();
};

initDB();
