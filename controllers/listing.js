const Listing = require("../modals/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });
const { cloudinary } = require("../cloudconfig.js");
const Booking = require("../modals/booking");
const RoomSharePool = require("../modals/roomShare");
const logger = require("../config/logger");

const DEFAULT_COORDINATES = [78.4867, 17.3850];

// Fallback stock photos used to top up a listing's gallery when the host
// uploads fewer than the minimum number of photos.
const DEFAULT_GALLERY_IMAGES = [
    { url: "https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?auto=format&fit=crop&w=800&q=60", filename: "" },
    { url: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=60", filename: "" },
    { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=60", filename: "" },
];
const DEFAULT_GALLERY_URLS = new Set(DEFAULT_GALLERY_IMAGES.map((i) => i.url));
const MIN_GALLERY_IMAGES = 3;
const MAX_GALLERY_IMAGES = 10;

function padWithDefaultImages(images) {
    const padded = [...images];
    let i = 0;
    while (padded.length < MIN_GALLERY_IMAGES) {
        padded.push(DEFAULT_GALLERY_IMAGES[i % DEFAULT_GALLERY_IMAGES.length]);
        i++;
    }
    return padded.slice(0, MAX_GALLERY_IMAGES);
}

function escapeRegex(string) {
    return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

function normalizeStringArray(val) {
    if (Array.isArray(val)) return val.map(String).filter(Boolean);
    if (typeof val === "string" && val.trim()) return [val.trim()];
    return [];
}

async function geocodeLocation(location) {
    if (process.env.NODE_ENV === "test" || !mapToken) {
        return { type: "Point", coordinates: DEFAULT_COORDINATES };
    }
    try {
        const response = await geocodingClient.forwardGeocode({
            query: location,
            limit: 1
        }).send();
        if (response?.body?.features?.length > 0) {
            return response.body.features[0].geometry;
        }
    } catch (err) {
        logger.error(`Geocoding failed for "${location}": ${err.message}`);
    }
    return { type: "Point", coordinates: DEFAULT_COORDINATES };
}

async function deleteCloudinaryImages(images) {
    if (process.env.NODE_ENV === "test" || !Array.isArray(images)) return;
    for (const img of images) {
        if (img && img.filename && img.filename !== "test_image") {
            try {
                await cloudinary.uploader.destroy(img.filename);
            } catch (err) {
                logger.error(`Failed to delete image from Cloudinary: ${err.message}`);
            }
        }
    }
}

module.exports.index = async (req, res) => {
    let { q, category, minPrice, maxPrice, guests, checkIn, checkOut, sort, amenity, page = 1 } = req.query;
    page = parseInt(page);
    if (isNaN(page) || page < 1) page = 1;
    const limit = 12;

    const queryObj = {};
    if (category) {
        queryObj.category = category;
    }

    // Price range filter
    const minP = Number(minPrice);
    const maxP = Number(maxPrice);
    if ((!isNaN(minP) && minPrice !== "" && minPrice !== undefined) || (!isNaN(maxP) && maxPrice !== "" && maxPrice !== undefined)) {
        queryObj.price = {};
        if (!isNaN(minP) && minPrice !== "" && minPrice !== undefined) queryObj.price.$gte = Math.max(0, minP);
        if (!isNaN(maxP) && maxPrice !== "" && maxPrice !== undefined) queryObj.price.$lte = Math.max(0, maxP);
    }

    // Guest capacity filter
    const minGuests = Number(guests);
    if (!isNaN(minGuests) && minGuests > 0) {
        queryObj.maxGuests = { $gte: minGuests };
    }

    // Amenity filter
    const selectedAmenities = normalizeStringArray(amenity);
    if (selectedAmenities.length > 0) {
        queryObj.amenities = { $all: selectedAmenities };
    }

    // Date availability filter (exclude listings with active overlapping bookings)
    if (checkIn && checkOut) {
        const inDate = new Date(checkIn);
        const outDate = new Date(checkOut);
        if (!isNaN(inDate.getTime()) && !isNaN(outDate.getTime()) && outDate > inDate) {
            const now = new Date();
            const overlappingListingIds = await Booking.distinct("listing", {
                checkIn: { $lt: outDate },
                checkOut: { $gt: inDate },
                $or: [
                    { status: "confirmed" },
                    { status: "pending", expiresAt: null },
                    { status: "pending", expiresAt: { $gt: now } }
                ]
            });
            if (overlappingListingIds.length > 0) {
                queryObj._id = { $nin: overlappingListingIds };
            }
        }
    }

    const sortOptions = {
        price_asc: { price: 1 },
        price_desc: { price: -1 },
        newest: { _id: -1 }
    };
    const sortObj = sortOptions[sort] || { _id: -1 };

    let allListings = [];
    let totalCount = 0;

    if (q) {
        queryObj.$text = { $search: q };
        totalCount = await Listing.countDocuments(queryObj);

        if (totalCount > 0) {
            allListings = await Listing.find(queryObj)
                .sort(sortObj)
                .skip((page - 1) * limit)
                .limit(limit);
        } else {
            delete queryObj.$text;
            const escapedQ = escapeRegex(q);
            queryObj.$or = [
                { title: { $regex: escapedQ, $options: "i" } },
                { location: { $regex: escapedQ, $options: "i" } },
                { country: { $regex: escapedQ, $options: "i" } }
            ];
            totalCount = await Listing.countDocuments(queryObj);
            allListings = await Listing.find(queryObj)
                .sort(sortObj)
                .skip((page - 1) * limit)
                .limit(limit);
        }
    } else {
        totalCount = await Listing.countDocuments(queryObj);
        allListings = await Listing.find(queryObj)
            .sort(sortObj)
            .skip((page - 1) * limit)
            .limit(limit);
    }

    const wishlistIds = req.user && Array.isArray(req.user.wishlist)
        ? req.user.wishlist.map((id) => id.toString())
        : [];

    const mapListings = allListings
        .filter((l) => l.geometry && Array.isArray(l.geometry.coordinates) && l.geometry.coordinates.length === 2)
        .map((l) => ({
            id: l._id.toString(),
            title: l.title,
            price: Number(l.price || 0),
            location: l.location,
            country: l.country,
            image: (l.image && l.image.url) ? l.image.url : "",
            coordinates: l.geometry.coordinates
        }));

    const totalPages = Math.ceil(totalCount / limit) || 1;

    // Support JSON responses for infinite scroll / lazy loading
    if (req.xhr || (req.headers.accept && req.headers.accept.includes("application/json")) || req.query.format === "json") {
        return res.json({
            listings: allListings.map((l) => ({
                id: l._id.toString(),
                title: l.title,
                location: l.location,
                country: l.country,
                price: Number(l.price || 0),
                image: (l.image && l.image.url) ? l.image.url : "https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?auto=format&fit=crop&w=800&q=60",
                category: l.category || "",
                isSaved: wishlistIds.includes(l._id.toString())
            })),
            mapListings,
            currentPage: page,
            totalPages,
            totalCount,
            hasMore: page < totalPages
        });
    }

    res.render("listings/index.ejs", {
        allListings,
        mapListings,
        wishlistIds,
        currentPage: page,
        totalPages,
        totalCount,
        q,
        category,
        filters: { q, category, minPrice, maxPrice, guests, checkIn, checkOut, sort, amenities: selectedAmenities },
        amenitiesList: Listing.AMENITIES,
        categories: Listing.CATEGORIES,
        title: "Explore Vacation Stays"
    });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs", {
        categories: Listing.CATEGORIES,
        amenitiesList: Listing.AMENITIES,
        title: "Host Your Home"
    });
};

module.exports.createListing = async (req, res) => {
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

    const uploadedImages = req.files.map((f) => ({ url: f.path, filename: f.filename }));
    const images = padWithDefaultImages(uploadedImages);
    const listingData = { ...req.body.listing };
    if (req.body._amenitiesSubmitted) {
        listingData.amenities = normalizeStringArray(listingData.amenities);
    }
    if (req.body._roomShareSubmitted) {
        listingData.allowRoomSharing = Boolean(listingData.allowRoomSharing);
    }

    const newListing = new Listing(listingData);
    newListing.owner = req.user;
    newListing.images = images;
    newListing.image = images[0];
    newListing.geometry = await geocodeLocation(req.body.listing.location);

    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};

module.exports.showListing = async (req, res) => {
    const { id } = req.params;
    const listings = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author",
                select: "username email avatar",
            },
        })
        .populate({ path: "owner", select: "username email avatar bio" });
    if (!listings) {
        req.flash("error", "Listing you requested for doesn't exist!");
        return res.redirect("/listings");
    }

    if (!listings.geometry || !listings.geometry.coordinates || listings.geometry.coordinates.length !== 2) {
        listings.geometry = await geocodeLocation(listings.location);
        await listings.save();
    }

    const gallery = (listings.images && listings.images.length > 0)
        ? listings.images
        : (listings.image && listings.image.url
            ? [listings.image]
            : [{ url: "https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?v=1", filename: "" }]);

    let bookings = [];
    let hasCompletedStay = false;
    let hasReviewed = false;
    let canReview = false;
    let isWishlisted = false;

    if (req.user) {
        isWishlisted = Array.isArray(req.user.wishlist) && req.user.wishlist.some((wId) => wId.equals(listings._id));
        hasReviewed = (listings.reviews || []).some((r) => r.author && r.author._id && r.author._id.equals(req.user._id));
        hasCompletedStay = Boolean(await Booking.exists({
            listing: id,
            guest: req.user._id,
            status: "confirmed",
            checkOut: { $lt: new Date() }
        }));
        canReview = hasCompletedStay && !hasReviewed;

        if (listings.owner && listings.owner._id.equals(req.user._id)) {
            bookings = await Booking.find({ listing: id })
                .populate({
                    path: "guest",
                    select: "username email"
                })
                .sort({ checkIn: 1 });
        }
    }

    const openSharePools = listings.allowRoomSharing
        ? await RoomSharePool.find({
            listing: id,
            status: "open",
            checkOut: { $gte: new Date() }
        })
            .populate("initiator", "username emailVerified travelProfile")
            .sort({ checkIn: 1 })
            .limit(6)
        : [];

    res.render("listings/show.ejs", {
        listings,
        gallery,
        bookings,
        openSharePools,
        canReview,
        hasReviewed,
        hasCompletedStay,
        isWishlisted,
        title: listings.title
    });
};

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const listings = await Listing.findById(id);
    if (!listings) {
        req.flash("error", "Listing you requested for doesn't exist!");
        return res.redirect("/listings");
    }

    const gallery = (listings.images && listings.images.length > 0)
        ? listings.images
        : (listings.image && listings.image.url ? [listings.image] : []);
    const galleryItems = gallery.map((img, idx) => ({
        index: idx,
        url: img.url,
        thumbUrl: img.url.replace("/upload", "/upload/w_250"),
        filename: img.filename || "",
        key: img.filename || img.url
    }));
    const galleryThumbs = galleryItems.map((i) => i.thumbUrl);
    res.render("listings/edit.ejs", {
        listings,
        galleryThumbs,
        galleryItems,
        categories: Listing.CATEGORIES,
        amenitiesList: Listing.AMENITIES,
        title: `Edit ${listings.title}`
    });
};

module.exports.updateListing = async (req, res) => {
    const { id } = req.params;
    const updateData = { ...req.body.listing };
    if (req.body._amenitiesSubmitted) {
        updateData.amenities = normalizeStringArray(updateData.amenities);
    }
    if (req.body._roomShareSubmitted) {
        updateData.allowRoomSharing = Boolean(updateData.allowRoomSharing);
    }

    const listing = await Listing.findByIdAndUpdate(id, updateData, { new: true });
    if (!listing) {
        req.flash("error", "Listing you requested for doesn't exist!");
        return res.redirect("/listings");
    }

    listing.geometry = await geocodeLocation(req.body.listing.location);

    const existingGallery = (listing.images && listing.images.length > 0)
        ? listing.images.map((img) => ({ url: img.url, filename: img.filename || "" }))
        : (listing.image && listing.image.url ? [{ url: listing.image.url, filename: listing.image.filename || "" }] : []);

    const toDeleteKeys = new Set(normalizeStringArray(req.body.deleteImages));
    let remainingImages = existingGallery;

    if (toDeleteKeys.size > 0) {
        const deletedImages = existingGallery.filter((img) => toDeleteKeys.has(img.filename || img.url) || toDeleteKeys.has(img.url));
        await deleteCloudinaryImages(deletedImages);
        remainingImages = existingGallery.filter((img) => !toDeleteKeys.has(img.filename || img.url) && !toDeleteKeys.has(img.url));
    }

    if (req.files && req.files.length > 0) {
        const uploadedImages = req.files.map((f) => ({ url: f.path, filename: f.filename }));
        // Drop auto-padded stock images when real photos are kept/added
        const realRemaining = remainingImages.filter((img) => !DEFAULT_GALLERY_URLS.has(img.url));
        const combined = [...realRemaining, ...uploadedImages].slice(0, MAX_GALLERY_IMAGES);
        listing.images = padWithDefaultImages(combined);
        listing.image = listing.images[0];
    } else if (toDeleteKeys.size > 0) {
        listing.images = padWithDefaultImages(remainingImages);
        listing.image = listing.images[0];
    }

    await listing.save();
    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    const { id } = req.params;
    const deletedListing = await Listing.findByIdAndDelete(id);
    if (deletedListing) {
        const images = (deletedListing.images && deletedListing.images.length > 0)
            ? deletedListing.images
            : (deletedListing.image && deletedListing.image.filename ? [deletedListing.image] : []);
        await deleteCloudinaryImages(images);
    }
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};
