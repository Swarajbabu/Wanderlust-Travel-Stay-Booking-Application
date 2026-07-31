const Listing = require("../modals/listing");
const Review = require("../modals/review"); 
const ExpressError = require("../utility/ExpressError");

module.exports.createReview = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        throw new ExpressError(404, "Listing Not Found");
    }
    const newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    console.log(newReview);
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

