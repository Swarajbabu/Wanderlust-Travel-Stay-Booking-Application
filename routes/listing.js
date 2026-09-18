const express = require("express");
const router = express.Router({ mergeParams: true });

const wrapAsync = require("../utility/wrapAsync");              // wrapErr
const { isLoggedIn, isOwner, validateListing, isEmailVerified } = require("../middleware.js");
const listingController = require("../controllers/listing.js");

const multer = require('multer')                   // File uploed we need to use
const { storage } = require("../cloudconfig.js");     // cloude connection to store images
const { doubleCsrfProtection } = require("../config/csrf.js");
const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Middleware to handle file upload errors (e.g., file size, too many files)
// Explanation : The handleUpload function is used to handle file upload errors (e.g., file size).
// Listings support 3-10 gallery images, uploaded via the "listing[images]" multi-file input.
const handleUpload = (req, res, next) => {
    upload.array('listing[images]', 10)(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
                req.flash("error", "One of the images exceeds the 5MB limit. Please upload smaller images.");
                return res.redirect(req.get("Referrer") || "/listings");
            }
            if (err instanceof multer.MulterError && err.code === 'LIMIT_UNEXPECTED_FILE') {
                req.flash("error", "You can upload a maximum of 10 images per listing.");
                return res.redirect(req.get("Referrer") || "/listings");
            }
            return next(err);
        }
        next();
    });
};

const csrfCheckAfterUpload = (req, res, next) => {
    if (process.env.NODE_ENV === "test") return next();
    doubleCsrfProtection(req, res, next);
};

router.route("/")
    .get(wrapAsync(listingController.index))
    .post(
        isLoggedIn,
        isEmailVerified,
        handleUpload,
        csrfCheckAfterUpload,
        validateListing,
        wrapAsync(listingController.createListing)
    );                                              // Creating the listing route

// New root or create
router.get("/new", isLoggedIn, isEmailVerified, listingController.renderNewForm);

router.route("/:id")
    .get(wrapAsync(listingController.showListing))                                          // Show Route of perticular id
    .put(
        isLoggedIn,
        isOwner,
        handleUpload,
        csrfCheckAfterUpload,
        validateListing,
        wrapAsync(listingController.updateListing)
    )  // Edit root or update
    .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));              // Delete root

router.route("/:id/edit")
    .get(isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));

module.exports = router;

