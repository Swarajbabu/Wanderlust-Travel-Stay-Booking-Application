const Listing = require("./modals/listing");
const Review = require("./modals/review");
const Booking = require("./modals/booking");
const { ListingSchema, reviewSchema, bookingSchema } = require("./schema.js");
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

// 
module.exports.isEmailVerified = (req, res, next) => {
    if (req.user && !req.user.emailVerified) {
        req.flash("error", "Please verify your email address to proceed. Check your inbox for the OTP code.");
        req.session.otpEmail = req.user.email;
        return res.redirect("/login/otp/verify");
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

// Middleware to validate booking information sent in request body against bookingSchema Joi rules.
module.exports.validateBooking = (req, res, next) => {
    let { error } = bookingSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};

// Middleware to authorize booking modification by verifying if the logged-in user is the guest.
module.exports.isBookingGuest = async (req, res, next) => {
    let { bookingId } = req.params;
    let booking = await Booking.findById(bookingId);
    if (!booking) {
        req.flash("error", "Booking you requested for does not exist!");
        return res.redirect("/bookings");
    }
    if (!booking.guest.equals(res.locals.currUser._id)) {
        req.flash("error", "You do not have permission to modify this booking!");
        return res.redirect("/bookings");
    }
    next();
};

// Middleware to authorize booking modification by verifying if the logged-in user is the listing owner.
module.exports.isBookingOwner = async (req, res, next) => {
    let { bookingId } = req.params;
    let booking = await Booking.findById(bookingId).populate("listing");
    if (!booking) {
        req.flash("error", "Booking you requested for does not exist!");
        return res.redirect("/listings");
    }
    if (!booking.listing.owner.equals(res.locals.currUser._id)) {
        req.flash("error", "You do not have permission to modify bookings for this listing!");
        return res.redirect(`/listings/${booking.listing._id}`);
    }
    next();
};

// Middleware to authorize booking cancellation by verifying if the logged-in user is either the guest or the owner.
module.exports.isBookingGuestOrOwner = async (req, res, next) => {
    let { bookingId } = req.params;
    let booking = await Booking.findById(bookingId).populate("listing");
    if (!booking) {
        req.flash("error", "Booking you requested for does not exist!");
        return res.redirect("/bookings");
    }
    const isGuest = booking.guest.equals(res.locals.currUser._id);
    const isOwner = booking.listing.owner.equals(res.locals.currUser._id);
    if (!isGuest && !isOwner) {
        req.flash("error", "You do not have permission to modify this booking!");
        return res.redirect("/bookings");
    }
    next();
};