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

    // Prevent duplicate reviews by the same guest on the same listing
    const existingReview = await Review.findOne({
        _id: { $in: listing.reviews },
        author: req.user._id
    });
    if (existingReview) {
        req.flash("error", "You have already submitted a review for this listing.");
        return res.redirect(`/listings/${id}`);
    }

    const newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();

    req.flash("success", "New Review Created!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyReview = async (req, res) => {
    const { id, reviewId } = req.params;
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Review Deleted!");
    res.redirect(`/listings/${id}`);
};
