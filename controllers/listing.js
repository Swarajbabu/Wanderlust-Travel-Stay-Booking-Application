const Listing = require("../modals/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });
const { cloudinary } = require("../cloudconfig.js");
const Booking = require("../modals/booking");
const logger = require("../config/logger");

// Fallback stock photos used to top up a listing's gallery when the host
// uploads fewer than the minimum number of photos.
const DEFAULT_GALLERY_IMAGES = [
    { url: "https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?auto=format&fit=crop&w=800&q=60", filename: "" },
    { url: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=60", filename: "" },
    { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=60", filename: "" },
];
const MIN_GALLERY_IMAGES = 3;

// Pads an uploaded images array with default stock photos so every listing
// has at least MIN_GALLERY_IMAGES photos in its gallery.
function padWithDefaultImages(images) {
    const padded = [...images];
    let i = 0;
    while (padded.length < MIN_GALLERY_IMAGES) {
        padded.push(DEFAULT_GALLERY_IMAGES[i % DEFAULT_GALLERY_IMAGES.length]);
        i++;
    }
    return padded;
}

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
    if (!req.files || req.files.length === 0) {
        if (process.env.NODE_ENV === "test") {
            req.files = [{
                path: "https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?auto=format&fit=crop&w=800&q=60",
                filename: "test_image"
            }];
        } else {
            req.flash("error", "Please upload at least 1 image (up to 10) for your listing.");
            return res.redirect("/listings/new");
        }
    }

    let response;
    try {
        response = await geocodingClient.forwardGeocode({
            query: req.body.listing.location,
            limit: 1
        }).send();
    } catch (e) {
        response = { body: { features: [] } };
    }

    const uploadedImages = req.files.map((f) => ({ url: f.path, filename: f.filename }));
    const images = padWithDefaultImages(uploadedImages);
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user;
    newListing.images = images;
    newListing.image = images[0];

    if (response && response.body && response.body.features && response.body.features.length > 0) {
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
    
    // Normalize gallery: fall back to the single legacy image field for older listings.
    const gallery = (listings.images && listings.images.length > 0)
        ? listings.images
        : (listings.image && listings.image.url
            ? [listings.image]
            : [{ url: "https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?v=1", filename: "" }]);

    let bookings = [];
    if (req.user && listings.owner._id.equals(req.user._id)) {
        bookings = await Booking.find({ listing: id })
            .populate({
                path: "guest",
                select: "username email"
            })
            .sort({ checkIn: 1 });
    }

    res.render("listings/show.ejs", { listings, gallery, bookings, title: listings.title });
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

    const gallery = (listings.images && listings.images.length > 0)
        ? listings.images
        : (listings.image && listings.image.url ? [listings.image] : []);
    const galleryThumbs = gallery.map((img) => img.url.replace("/upload", "/upload/w_250"));
    res.render("listings/edit.ejs", { listings, galleryThumbs, title: `Edit ${listings.title}` });
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

    if (req.files && req.files.length > 0) {
        // deleting the old gallery images from cloudinary
        const oldImages = (listing.images && listing.images.length > 0)
            ? listing.images
            : (listing.image && listing.image.filename ? [listing.image] : []);
        for (const oldImg of oldImages) {
            if (oldImg && oldImg.filename) {
                try {
                    await cloudinary.uploader.destroy(oldImg.filename);
                } catch (err) {
                    logger.error(`Failed to delete old image from Cloudinary: ${err.message}`);
                }
            }
        }

        const uploadedImages = req.files.map((f) => ({ url: f.path, filename: f.filename }));
        const images = padWithDefaultImages(uploadedImages);
        listing.images = images;
        listing.image = images[0];
    }
    await listing.save();
    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};

// Delete the listing
module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    const deletedListing = await Listing.findByIdAndDelete(id);
    // deleting the gallery images from cloudinary
    if (deletedListing) {
        const images = (deletedListing.images && deletedListing.images.length > 0)
            ? deletedListing.images
            : (deletedListing.image && deletedListing.image.filename ? [deletedListing.image] : []);
        for (const img of images) {
            if (img && img.filename) {
                try {
                    await cloudinary.uploader.destroy(img.filename);
                } catch (err) {
                    logger.error(`Failed to delete image from Cloudinary upon listing deletion: ${err.message}`);
                }
            }
        }
    }
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};
