const express = require("express");
const router = express.Router({ mergeParams: true });

const wrapAsync = require("../utility/wrapAsync");              // wrapErr
const { isLoggedIn, isOwner, validateListing, isEmailVerified } = require("../middleware.js");
const listingController = require("../controllers/listing.js");

const multer = require('multer')                   // File uploed we need to use
const { storage } = require("../cloudconfig.js");     // cloude connection to store images
const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Middleware to handle file upload errors (e.g., file size)
// Explanation : The handleUpload function is used to handle file upload errors (e.g., file size). 
const handleUpload = (req, res, next) => {
    upload.single('listing[image]')(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
                req.flash("error", "Image file size exceeds the 5MB limit. Please upload a smaller image.");
                return res.redirect(req.get("Referrer") || "/listings");
            }
            return next(err);
        }
        next();
    });
};

router.route("/")
    .get(wrapAsync(listingController.index))
    .post(
        isLoggedIn,
        isEmailVerified,
        handleUpload,
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
        validateListing,
        wrapAsync(listingController.updateListing)
    )  // Edit root or update
    .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));              // Delete root

router.route("/:id/edit")
    .get(isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));

module.exports = router;

