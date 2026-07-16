const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const ejsMate = require("ejs-mate");                                         // EJS mate layout 
const methodOverride = require("method-override");                           // Override HTTP methods like PUT,PATCH and DELETE

// const Listing = require("./modals/listing.js");                              // Listing modal schema for store data
// const Review = require("./modals/review.js");                                // Review modal schema for store data
// const ExpressError = require("./utility/ExpressError.js");                   // Custom Error Class     
// const wrapAsync = require("./utility/wrapAsync.js");                         // Async Handler same work like try catch block 
// const { ListingSchema, reviewSchema } = require("./schema.js");              // Joi schema validation it work for validating that we send a valid data 

const router_listing = require("./routes/listing.js");
const router_reviews = require("./routes/review.js");

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"))
app.engine("ejs", ejsMate);

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

app.use("/listings",router_listing);                            
app.use("/listings/:id/reviews",router_reviews);

// 404 error handling for all the request.
app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found"));
})

// error handling for all the request.
app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something Went Wrong" } = err;
    res.status(statusCode).render("error.ejs", { err });
    // res.status(statusCode).send(message);
});

app.listen(port, () => {
    console.log(`Server Started in: ${port}`)
});




