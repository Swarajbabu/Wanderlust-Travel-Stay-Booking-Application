const Listing = require("../modals/listing");
const Review = require("../modals/review"); 
const Booking = require("../modals/booking");
const ExpressError = require("../utility/ExpressError");

module.exports.createReview = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        throw new ExpressError(404, "Listing Not Found");
    }

    // Restrict review to guests with a confirmed past booking
    const bookingExists = await Booking.findOne({
        listing: id,
        guest: req.user._id,
        status: "confirmed",
        checkOut: { $lt: new Date() }
    });

    if (!bookingExists) {
        req.flash("error", "You can only review stays you have already completed (confirmed booking with checkout in the past).");
        return res.redirect(`/listings/${id}`);
    }

    const newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    listing.reviews.push(newReview);
    await listing.save();
    await newReview.save();

    req.flash("success","New Review Created!");
    res.redirect(`/listings/${id}`);
    // console.log(listing);
    // res.send("Working");
};

module.exports.destroyReview = async (req, res) => {
    let { id, reviewId } = req.params;
    // pull it help to delete that id from the array. and search the listing id and go to the reviews array
    // and delete that review id
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } })
    await Review.findByIdAndDelete(reviewId);
    req.flash("success","Review Deleted!");
    res.redirect(`/listings/${id}`);
};

