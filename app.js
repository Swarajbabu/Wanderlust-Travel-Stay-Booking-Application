const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const ejsMate = require("ejs-mate");                                         // EJS mate layout 
const Listing = require("./modals/listing.js");                              // Listing modal schema for store data
const Review = require("./modals/review.js");                                // Review modal schema for store data
const methodOverride = require("method-override");                           // Override HTTP methods like PUT,PATCH and DELETE
const ExpressError = require("./utility/ExpressError.js");                   // Custom Error Class     
const wrapAsync = require("./utility/wrapAsync.js");                         // Async Handler same work like try catch block 
const { ListingSchema, reviewSchema } = require("./schema.js");              // Joi schema validation it work for validating that we send a valid data 

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

// To diaplay all the data
app.get("/listings", wrapAsync(async (req, res) => {
    const allListings = await Listing.find({})
    res.render("listings/index.ejs", { allListings })
    // res.send("Working");
}));

const validateListing = (req, res, next) => {
    let { error } = ListingSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
}

const validateReview = (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
}

// New root or create
app.get("/listings/new", (req, res) => {
    res.render("listings/new.ejs");
});
app.post("/listings", validateListing, wrapAsync(async (req, res, next) => {
    const newListing = new Listing(req.body.listing);
    await newListing.save();
    // console.log("Listing Saved");
    res.redirect("/listings");
}));

// Show Route of perticular id
app.get("/listings/:id", wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listings = await Listing.findById(id).populate("reviews");
    if (!listings) {
        throw new ExpressError(404, "Listing Not Found");
    }
    res.render("listings/show.ejs", { listings });
}));

//Edit root or update
app.get("/listings/:id/edit", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listings = await Listing.findById(id);
    res.render("listings/edit.ejs", { listings });
    // res.send("Working");
}));
app.put("/listings/:id", validateListing, wrapAsync(async (req, res) => {
    if (!req.body.listing) {
        throw new ExpressError(400, "Send valid data");
    }
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    res.redirect(`/listings/${id}`);
}));

// Delete root
app.delete("/listings/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    res.redirect("/listings");
}));


//Reviews root Post
app.post("/listings/:id/reviews", validateReview, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        throw new ExpressError(404, "Listing Not Found");
    }
    const newReview = new Review(req.body.review);
    listing.reviews.push(newReview);
    await listing.save();
    await newReview.save();

    res.redirect(`/listings/${id}`);
    // console.log(listing);
    // res.send("Working");
}));

// Deleting the reviews
app.delete("/listings/:id/reviews/:reviewId", wrapAsync(async (req, res) => {
    let { id, reviewId } = req.params;
    // pull it help to delete that id from the array. and search the listing id and go to the reviews array
    // and delete that review id
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } })
    await Review.findByIdAndDelete(reviewId);
    res.redirect(`/listings/${id}`);
}));


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




