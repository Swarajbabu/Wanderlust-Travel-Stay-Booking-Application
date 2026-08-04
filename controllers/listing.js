const Listing = require("../modals/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

// showing all the listing
module.exports.index = async (req, res) => {
    let { q, category } = req.query;
    let queryObj = {};
    if (q) {
        queryObj.$or = [
            { title: { $regex: q, $options: "i" } },
            { location: { $regex: q, $options: "i" } },
            { country: { $regex: q, $options: "i" } }
        ];
    }
    if (category) {
        queryObj.category = category;
    }
    const allListings = await Listing.find(queryObj);
    res.render("listings/index.ejs", { allListings });
};

// rendering to the new listing form
module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
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
            },
        })
        .populate("owner");
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
            console.error("On-demand geocoding failed for listing:", listings._id, err);
        }
    }

    res.render("listings/show.ejs", { listings });
};

// Showing Edit Form
module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listings = await Listing.findById(id);
    if (!listings) {
        req.flash("error", "Listing you requested for doesn't exist!");
        res.redirect("/listings");
    }

    let originalImageUrl = listings.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", { listings, originalImageUrl });
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
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};
