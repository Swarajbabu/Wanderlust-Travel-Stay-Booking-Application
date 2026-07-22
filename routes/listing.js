const express = require("express");
const router = express.Router({ mergeParams: true });

const wrapAsync = require("../utility/wrapAsync");              // wrapErr
const ExpressError = require("../utility/ExpressError");        // Custom Error

const Listing = require("../modals/listing");                   // Schema
const { ListingSchema, reviewSchema } = require("../schema.js");// Schema Validation
const flash = require("connect-flash");

const validateListing = (req, res, next) => {
    let { error } = ListingSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
}

// To diaplay all the data
router.get("/", wrapAsync(async (req, res) => {
    const allListings = await Listing.find({})
    res.render("listings/index.ejs", { allListings })
    // res.send("Working");
}));


// New root or create
router.get("/new", (req, res) => {
    res.render("listings/new.ejs");
});
router.post("/", validateListing, wrapAsync(async (req, res, next) => {
    const newListing = new Listing(req.body.listing);
    await newListing.save();
    req.flash("success","New Listing Created!");
    // console.log("Listing Saved");
    res.redirect("/listings");
}));

// Show Route of perticular id
router.get("/:id", wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listings = await Listing.findById(id).populate("reviews");
    if (!listings) {
        req.flash("error","Listing you requested for doesn't exist!");
        res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listings });
}));

//Edit root or update
router.get("/:id/edit", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listings = await Listing.findById(id);
    if (!listings) {
        req.flash("error","Listing you requested for doesn't exist!");
        res.redirect("/listings");
    }
    res.render("listings/edit.ejs", { listings });
    // res.send("Working");
}));
router.put("/:id", validateListing, wrapAsync(async (req, res) => {
    if (!req.body.listing) {
        throw new ExpressError(400, "Send valid data");
    }
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    req.flash("success","Listing Updated!");
    res.redirect(`/listings/${id}`);
}));

// Delete root
router.delete("/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success","Listing Deleted!");
    res.redirect("/listings");
}));

module.exports = router;


