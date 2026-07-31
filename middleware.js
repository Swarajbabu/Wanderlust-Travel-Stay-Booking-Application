const Listing = require("./modals/listing");
const Review = require("./modals/review");
const { ListingSchema, reviewSchema } = require("./schema.js");
const ExpressError = require("./utility/ExpressError.js");

// Middleware to check if the user is currently logged in.
// Used in:
// - routes/listing.js: Protecting the new listing form (GET /new), creating a listing (POST /), editing a listing (GET /:id/edit), updating a listing (PUT /:id), and deleting a listing (DELETE /:id).
// - routes/review.js: Protecting review creation (POST /) and review deletion (DELETE /:reviewId).
module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "You must be logged in to create listing!");
        return res.redirect("/login");
    }
    next();
};

// Middleware to save the page URL the user was trying to access before being redirected to login.
// Used in:
// - routes/user.js: Executed during the POST /login route to redirect the user back to their original destination after successfully logging in.
module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

// Middleware to authorize edit/delete actions by verifying if the logged-in user is the owner of the listing.
// Used in:
// - routes/listing.js: Protecting the edit listing view (GET /:id/edit), the update listing route (PUT /:id), and the delete listing route (DELETE /:id).
module.exports.isOwner = async (req, res, next) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }
    if (!listing.owner.equals(res.locals.currUser._id)) {
        req.flash("error", "You are not the owner of this listing");
        return res.redirect(`/listings/${id}`);
    }
    next();
};

// Middleware to validate the listing information sent in the request body against our Joi schema rules.
// Used in:
// - routes/listing.js: Executed before creating a listing (POST /) and updating a listing (PUT /:id) to ensure all required fields are present and valid.
module.exports.validateListing = (req, res, next) => {
    let { error } = ListingSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};

// Middleware to validate the review information sent in the request body against our Joi schema rules.
// Used in:
// - routes/review.js: Executed before creating a review (POST /) to ensure the rating and comment are valid.
module.exports.validateReview = (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};

// Middleware to authorize review deletion by verifying if the logged-in user is the author of the review.
// Used in:
// - routes/review.js: Protecting the delete review route (DELETE /:reviewId).
module.exports.isReviewAuthor = async (req, res, next) => {
    let { id, reviewId } = req.params;
    let review = await Review.findById(reviewId);
    if (!review) {
        req.flash("error", "Review you requested for does not exist!");
        return res.redirect(`/listings/${id}`);
    }
    if (!review.author.equals(res.locals.currUser._id)) {
        req.flash("error", "You do not have permission to delete this review!");
        return res.redirect(`/listings/${id}`);
    }
    next();
};