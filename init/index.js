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

Listing.insertMany(initData.data).then((res)=>{
    console.log("data Inserted");
})



