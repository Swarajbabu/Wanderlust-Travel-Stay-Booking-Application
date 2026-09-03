const Listing = require("../modals/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });
const { cloudinary } = require("../cloudconfig.js");
const Booking = require("../modals/booking");
const logger = require("../config/logger");

// Helper to escape regex special characters
function escapeRegex(string) {
    return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

// showing all the listing
// Explanation : The escapeRegex function is used to escape any special characters in the search query (q) to prevent regex injection attacks. 
// The queryObj is an object that is used to filter the listings based on the search query and category. The $or operator is used to find listings that match either the title, location, or country. 
// The $options: "i" option makes the search case-insensitive.
module.exports.index = async (req, res) => {
    let { q, category, page = 1 } = req.query;
    page = parseInt(page);
    if (isNaN(page) || page < 1) page = 1;
    const limit = 12;

    let queryObj = {};
    if (category) {
        queryObj.category = category;
    }

    let allListings = [];
    let totalCount = 0;

    if (q) {
        // Try $text search first
        queryObj.$text = { $search: q };
        totalCount = await Listing.countDocuments(queryObj);
        
        if (totalCount > 0) {
            allListings = await Listing.find(queryObj)
                .skip((page - 1) * limit)
                .limit(limit);
        } else {
            // Fall back gracefully to regex search
            delete queryObj.$text;
            const escapedQ = escapeRegex(q);
            queryObj.$or = [
                { title: { $regex: escapedQ, $options: "i" } },
                { location: { $regex: escapedQ, $options: "i" } },
                { country: { $regex: escapedQ, $options: "i" } }
            ];
            totalCount = await Listing.countDocuments(queryObj);
            allListings = await Listing.find(queryObj)
                .skip((page - 1) * limit)
                .limit(limit);
        }
    } else {
        totalCount = await Listing.countDocuments(queryObj);
        allListings = await Listing.find(queryObj)
            .skip((page - 1) * limit)
            .limit(limit);
    }

    res.render("listings/index.ejs", { 
        allListings, 
        currentPage: page, 
        totalPages: Math.ceil(totalCount / limit), 
        q, 
        category,
        title: "Explore Vacation Stays"
    });
};

// rendering to the new listing form
module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs", { title: "Host Your Home" });
};

// creating the new listing
module.exports.createListing = async (req, res, next) => {
    let response = await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1
    }).send();

    let url = req.file ? req.file.path : "https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?v=1";
    let filename = req.file ? req.file.filename : "listingimage";
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user;
    newListing.image = { url, filename };

    if (response.body.features && response.body.features.length > 0) {
        newListing.geometry = response.body.features[0].geometry;
    } else {
        newListing.geometry = {
            type: "Point",
            coordinates: [78.4867, 17.3850]
        };
    }

    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};

// Showing a perticular listing id
module.exports.showListing = async (req, res) => {
    const { id } = req.params;
    const listings = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author",
                select: "username email",
            },
        })
        .populate({ path: "owner", select: "username email" });
    if (!listings) {
        req.flash("error", "Listing you requested for doesn't exist!");
        res.redirect("/listings");
        return;
    }

    // Auto-geocode coordinates on-demand if missing
    if (!listings.geometry || !listings.geometry.coordinates || listings.geometry.coordinates.length !== 2) {
        try {
            let response = await geocodingClient.forwardGeocode({
                query: listings.location,
                limit: 1
            }).send();
            if (response.body.features && response.body.features.length > 0) {
                listings.geometry = response.body.features[0].geometry;
                await listings.save();
            }
        } catch (err) {
            logger.error(`On-demand geocoding failed for listing: ${listings._id} - ${err.message}`);
        }
    }
    
    let bookings = [];
    if (req.user && listings.owner._id.equals(req.user._id)) {
        bookings = await Booking.find({ listing: id })
            .populate({
                path: "guest",
                select: "username email"
            })
            .sort({ checkIn: 1 });
    }

    res.render("listings/show.ejs", { listings, bookings, title: listings.title });
};

// Showing Edit Form
module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listings = await Listing.findById(id);
    if (!listings) {
        req.flash("error", "Listing you requested for doesn't exist!");
        res.redirect("/listings");
        return;
    }

    let originalImageUrl = listings.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", { listings, originalImageUrl, title: `Edit ${listings.title}` });
};

// Updating the listing
module.exports.updateListing = async (req, res) => {
    let { id } = req.params;

    let response = await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1
    }).send();

    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, { new: true });

    if (response.body.features && response.body.features.length > 0) {
        listing.geometry = response.body.features[0].geometry;
    } else {
        listing.geometry = {
            type: "Point",
            coordinates: [78.4867, 17.3850]
        };
    }

    if (typeof req.file !== 'undefined') {
        // deleting the old image from cloudinary
        if (listing.image && listing.image.filename) {
            try {
                await cloudinary.uploader.destroy(listing.image.filename);
            } catch (err) {
                logger.error(`Failed to delete old image from Cloudinary: ${err.message}`);
            }
        }
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
    }
    await listing.save();
    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};

// Delete the listing
module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    const deletedListing = await Listing.findByIdAndDelete(id);
    // deleting the old image from cloudinary
    if (deletedListing && deletedListing.image && deletedListing.image.filename) {
        try {
            await cloudinary.uploader.destroy(deletedListing.image.filename);
        } catch (err) {
            logger.error(`Failed to delete image from Cloudinary upon listing deletion: ${err.message}`);
        }
    }
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};
