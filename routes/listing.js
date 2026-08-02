const express = require("express");
const router = express.Router({ mergeParams: true });

const wrapAsync = require("../utility/wrapAsync");              // wrapErr
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listing.js");

const multer = require('multer')                   // File uploed we need to use
const upload = multer({ dest: 'uploads/' })         // what ever we have uplodes stores in uploads/ folder

router.route("/")
    .get(wrapAsync(listingController.index))
    // .post(validateListing, isLoggedIn, wrapAsync(listingController.createListing));         // Creating the listing route
    .post(upload.single('listing[image]'), (req, res) => {
        res.send(req.file);
    })

// New root or create
router.get("/new", isLoggedIn, listingController.renderNewForm);

router.route("/:id")
    .get(wrapAsync(listingController.showListing))                                          // Show Route of perticular id
    .put(validateListing, isLoggedIn, isOwner, wrapAsync(listingController.updateListing))  // Edit root or update
    .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));              // Delete root

router.route("/:id/edit")
    .get(isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));

module.exports = router;

