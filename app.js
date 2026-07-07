const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./modals/listing.js");

let port = 8080;
let mongodb_url = 'mongodb://127.0.0.1/wanderlust';

mongoose.connect(mongodb_url)
    .then((res) => {
        console.log("Connected");
    }).catch((err) => {
        console.log(err);
    });

app.get("/", (req, res) => {
    res.send("I am root")
});

app.get("/test", async (req, res) => {
    
    res.send("Working");
    console.log("Working");
});


app.listen(port, () => {
    console.log(`Server Started in: ${port}`)
});
