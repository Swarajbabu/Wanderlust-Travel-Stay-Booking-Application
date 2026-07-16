const express = require("express");
const router = express.Router({ mergeParams: true });               //For to use req.perams true mergeParams 

const wrapAsync = require("../utility/wrapAsync");                  // wrapErr
const ExpressError = require("../utility/ExpressError");            // Custom Error

const Listing = require("../modals/listing");                       // Schema mongoos schema
const Review = require("../modals/review.js");                      // reviews mongoos schema
const { ListingSchema, reviewSchema } = require("../schema");       // Schema Validation


const validateReview = (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};


//Reviews root Post
router.post("/", validateReview, wrapAsync(async (req, res) => {
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
router.delete("/:reviewId", wrapAsync(async (req, res) => {
    let { id, reviewId } = req.params;
    // pull it help to delete that id from the array. and search the listing id and go to the reviews array
    // and delete that review id
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } })
    await Review.findByIdAndDelete(reviewId);
    res.redirect(`/listings/${id}`);
}));

module.exports = router;
