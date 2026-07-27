const mongoose = require("mongoose");
const initData = require("./data");
const Listing = require("../modals/listing");


let mongodb_url = 'mongodb://127.0.0.1/wanderlust';
mongoose.connect(mongodb_url)
    .then((res) => {
        console.log("Connected");
    }).catch((err) => {
        console.log(err);
    });

const initDB = async () => {
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj) => ({
        ...obj,
        owner: "6a6055e51d0707375e698376",
    }));
    await Listing.insertMany(initData.data);
    console.log("data was initialized");
};

initDB();
