const Listing = require("./modals/listing");
const Review = require("./modals/review");
const Booking = require("./modals/booking");
const RoomSharePool = require("./modals/roomShare");
const { ListingSchema, reviewSchema, bookingSchema, editBookingDatesSchema, cancelBookingSchema, roomShareSchema, roomShareJoinSchema, roomShareSelectStaySchema, itineraryRequestSchema } = require("./schema.js");
const ExpressError = require("./utility/ExpressError.js");

const DEMO_PRIVILEGED_USERNAMES = new Set(["guest_user", "wanderlust_admin", "Wonderlust_host"]);

// Centralized privilege check: real admins always pass; demo usernames only bypass ownership when ENABLE_DEMO_MODE=true.
function hasAdminOrDemoPrivilege(user) {
    if (!user) return false;
    if (user.role === "admin") return true;
    return process.env.ENABLE_DEMO_MODE === "true" && DEMO_PRIVILEGED_USERNAMES.has(user.username);
}

module.exports.hasAdminOrDemoPrivilege = hasAdminOrDemoPrivilege;

function createJoiValidator(schema, { redirectFallback = null } = {}) {
    return (req, res, next) => {
        const bodyCopy = { ...req.body };
        delete bodyCopy._csrf;
        delete bodyCopy._method;
        const { error } = schema.validate(bodyCopy);
        if (error) {
            const errMsg = error.details.map((el) => el.message).join(",");
            if (redirectFallback) {
                req.flash("error", errMsg);
                return res.redirect(req.get("Referrer") || redirectFallback);
            }
            throw new ExpressError(400, errMsg);
        }
        next();
    };
}

// Middleware to check if the user is currently logged in.
module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        if (req.xhr || (req.headers["content-type"] === "application/json" && !req.accepts("html"))) {
            return res.status(401).json({ error: "Authentication required" });
        }
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "You must be logged in to continue!");
        return res.redirect("/login");
    }
    next();
};

// Middleware to verify the logged-in user has confirmed their email address via OTP or OAuth.
module.exports.isEmailVerified = (req, res, next) => {
    if (req.user && !req.user.emailVerified) {
        req.flash("error", "Please verify your email address to proceed. Check your inbox for the OTP code.");
        req.session.otpEmail = req.user.email;
        return res.redirect("/login/otp/verify");
    }
    next();
};

// Middleware to save the page URL the user was trying to access before being redirected to login.
module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

// Middleware to authorize edit/delete actions by verifying if the logged-in user is the owner of the listing.
module.exports.isOwner = async (req, res, next) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }
    const isAllowed = Boolean(
        res.locals.currUser &&
        (listing.owner.equals(res.locals.currUser._id) || hasAdminOrDemoPrivilege(res.locals.currUser))
    );
    if (!isAllowed) {
        req.flash("error", "You are not the owner of this listing");
        return res.redirect(`/listings/${id}`);
    }
    next();
};

// Joi body validators
module.exports.validateListing = createJoiValidator(ListingSchema);
module.exports.validateReview = createJoiValidator(reviewSchema);
module.exports.validateBooking = createJoiValidator(bookingSchema);
module.exports.validateEditBookingDates = createJoiValidator(editBookingDatesSchema, { redirectFallback: "/bookings" });
module.exports.validateCancellation = createJoiValidator(cancelBookingSchema, { redirectFallback: "/bookings" });
module.exports.validateRoomShare = createJoiValidator(roomShareSchema, { redirectFallback: "/room-shares" });
module.exports.validateRoomShareJoin = createJoiValidator(roomShareJoinSchema, { redirectFallback: "/room-shares" });
module.exports.validateRoomShareSelectStay = createJoiValidator(roomShareSelectStaySchema, { redirectFallback: "/room-shares" });
module.exports.validateItineraryRequest = createJoiValidator(itineraryRequestSchema, { redirectFallback: "/itineraries/new" });

// Middleware to authorize review deletion by verifying if the logged-in user is the author of the review.
module.exports.isReviewAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review) {
        req.flash("error", "Review you requested for does not exist!");
        return res.redirect(`/listings/${id}`);
    }
    const isAllowed = Boolean(
        res.locals.currUser &&
        (review.author.equals(res.locals.currUser._id) || hasAdminOrDemoPrivilege(res.locals.currUser))
    );
    if (!isAllowed) {
        req.flash("error", "You do not have permission to delete this review!");
        return res.redirect(`/listings/${id}`);
    }
    next();
};

// Middleware to authorize booking modification by verifying if the logged-in user is the guest.
module.exports.isBookingGuest = async (req, res, next) => {
    try {
        const { bookingId } = req.params;
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            req.flash("error", "Booking you requested for does not exist!");
            return res.redirect("/bookings");
        }
        if (!booking.guest || !res.locals.currUser || !booking.guest.equals(res.locals.currUser._id)) {
            req.flash("error", "You do not have permission to modify this booking!");
            return res.redirect("/bookings");
        }
        next();
    } catch (err) {
        next(err);
    }
};

// Middleware to restrict the "skip payment" quick-confirm route to the demo guest evaluation account.
module.exports.isGuestDemoUser = (req, res, next) => {
    if (!res.locals.currUser || res.locals.currUser.username !== "guest_user") {
        req.flash("error", "This quick-confirm option is only available on the guest evaluation account.");
        return res.redirect("/bookings");
    }
    next();
};

// Middleware to authorize booking modification by verifying if the logged-in user is the listing owner.
module.exports.isBookingOwner = async (req, res, next) => {
    try {
        const { bookingId } = req.params;
        const booking = await Booking.findById(bookingId).populate("listing");
        if (!booking) {
            req.flash("error", "Booking you requested for does not exist!");
            return res.redirect("/listings");
        }
        if (!booking.listing || !booking.listing.owner || !res.locals.currUser || !booking.listing.owner.equals(res.locals.currUser._id)) {
            req.flash("error", "You do not have permission to modify bookings for this listing!");
            return res.redirect(booking.listing ? `/listings/${booking.listing._id}` : "/listings");
        }
        next();
    } catch (err) {
        next(err);
    }
};

// Middleware to authorize booking cancellation/editing by verifying if the logged-in user is either the guest or the owner.
module.exports.isBookingGuestOrOwner = async (req, res, next) => {
    try {
        const { bookingId } = req.params;
        const booking = await Booking.findById(bookingId).populate("listing");
        if (!booking) {
            req.flash("error", "Booking you requested for does not exist!");
            return res.redirect("/bookings");
        }
        const isGuest = Boolean(booking.guest && res.locals.currUser && booking.guest.equals(res.locals.currUser._id));
        const isOwner = Boolean(booking.listing && booking.listing.owner && res.locals.currUser && booking.listing.owner.equals(res.locals.currUser._id));
        let isSharedPoolMember = false;
        if (!isGuest && !isOwner && req.method === "GET" && booking.isSharedBooking && booking.roomSharePool && res.locals.currUser) {
            const sharedPool = await RoomSharePool.findById(booking.roomSharePool).select("participants");
            if (sharedPool) {
                isSharedPoolMember = (sharedPool.participants || []).some(
                    (p) => p.user && p.user.equals(res.locals.currUser._id) && p.joinStatus === "accepted"
                );
            }
        }
        if (!isGuest && !isOwner && !isSharedPoolMember && !hasAdminOrDemoPrivilege(res.locals.currUser)) {
            req.flash("error", "You do not have permission to modify this booking!");
            return res.redirect("/bookings");
        }
        next();
    } catch (err) {
        next(err);
    }
};
