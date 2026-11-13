const Listing = require("../modals/listing");
const Booking = require("../modals/booking");
const TripItinerary = require("../modals/itinerary");
const ExpressError = require("../utility/ExpressError");
const { generatePersonalizedItinerary } = require("../services/itineraryService");

const ITINERARY_INTERESTS = [
    "Nature", "Adventure", "Heritage", "Culture",
    "Food", "Photography", "Shopping", "Wellness"
];

const CATEGORY_INTEREST_MAP = {
    Mountains: ["Nature", "Adventure", "Photography"],
    Camping: ["Nature", "Adventure", "Photography"],
    Farms: ["Nature", "Wellness", "Food"],
    Arctic: ["Nature", "Adventure", "Photography"],
    "Off-the-grid": ["Nature", "Wellness", "Adventure"],
    Caves: ["Adventure", "Heritage", "Photography"],
    Castles: ["Heritage", "Culture", "Photography"],
    "Iconic Cities": ["Culture", "Food", "Shopping"],
    Rooms: ["Culture", "Food", "Shopping"],
    "Creative spaces": ["Culture", "Photography", "Food"],
    "Amazing Pools": ["Wellness", "Food", "Photography"],
    Mansions: ["Heritage", "Wellness", "Food"],
    Houseboats: ["Nature", "Wellness", "Food"],
    Yurts: ["Nature", "Wellness", "Adventure"],
    "Casas particulares": ["Culture", "Food", "Heritage"],
    New: ["Nature", "Culture", "Food"],
    Play: ["Adventure", "Food", "Shopping"]
};

const KEYWORD_INTEREST_RULES = [
    { interest: "Nature", regex: /\b(nature|mountain|hill|valley|lake|river|forest|beach|coast|island|garden|park|waterfall|pine)\b/i },
    { interest: "Adventure", regex: /\b(trek|hike|ski|kayak|rafting|paragliding|camp|surf|safari|trail|climb|adventure)\b/i },
    { interest: "Heritage", regex: /\b(fort|palace|castle|monument|historic|heritage|ancient|temple|museum|ruin|colonial)\b/i },
    { interest: "Culture", regex: /\b(art|culture|local|village|traditional|bazaar|old town|quarter|music|festival)\b/i },
    { interest: "Food", regex: /\b(food|cafe|dining|kitchen|breakfast|cuisine|restaurant|bakery|street food|culinary|wine)\b/i },
    { interest: "Photography", regex: /\b(view|sunset|sunrise|scenic|panoram|photo|lookout|balcony|terrace|skyline)\b/i },
    { interest: "Shopping", regex: /\b(market|shop|mall|craft|boutique|souvenir|textile|handicraft)\b/i },
    { interest: "Wellness", regex: /\b(spa|wellness|pool|yoga|hot spring|retreat|relax|jacuzzi|quiet|calm|peaceful)\b/i }
];

function deriveStayDays({ booking, listing, queryDays }) {
    if (booking && booking.checkIn && booking.checkOut) {
        const diff = Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24));
        return Math.max(1, Math.min(14, diff || 1));
    }

    const parsedQueryDays = Number(queryDays);
    if (Number.isInteger(parsedQueryDays) && parsedQueryDays >= 1 && parsedQueryDays <= 14) {
        return parsedQueryDays;
    }

    const titleText = `${listing?.title || ""} ${listing?.description || ""}`;
    const explicitDayMatch = /\b(\d{1,2})\s*[- ]?(?:day|days|night|nights)\b/i.exec(titleText);
    if (explicitDayMatch) {
        const val = Number(explicitDayMatch[1]);
        if (val >= 1 && val <= 14) return val;
    }
    if (/\bweekend\b/i.test(titleText)) return 2;
    if (/\bweek\b/i.test(titleText)) return 7;
    if (listing && ["Farms", "Camping", "Rooms"].includes(listing.category)) return 2;
    if (listing && ["Mountains", "Iconic Cities", "Houseboats"].includes(listing.category)) return 3;
    return 3;
}

function deriveInterests({ listing, booking, user }) {
    const picked = new Set();

    const profileInterests = user?.travelProfile?.interests || [];
    profileInterests.forEach((item) => {
        const matched = ITINERARY_INTERESTS.find((i) => i.toLowerCase() === String(item).trim().toLowerCase());
        if (matched) picked.add(matched);
    });

    if (listing && listing.category && CATEGORY_INTEREST_MAP[listing.category]) {
        CATEGORY_INTEREST_MAP[listing.category].forEach((i) => picked.add(i));
    }

    const combinedText = [
        listing?.title || "",
        listing?.description || "",
        listing?.location || "",
        Array.isArray(listing?.amenities) ? listing.amenities.join(" ") : "",
        booking?.specialRequests || ""
    ].join(" ");

    KEYWORD_INTEREST_RULES.forEach((rule) => {
        if (rule.regex.test(combinedText)) {
            picked.add(rule.interest);
        }
    });

    if (picked.size === 0) {
        return ["Nature", "Adventure", "Heritage"];
    }
    return [...picked].slice(0, 5);
}

function deriveScheduleAndPace({ listing, user }) {
    const travelStyle = user?.travelProfile?.travelStyle || "";
    const sleepSchedule = user?.travelProfile?.sleepSchedule || "";

    let pace = "balanced";
    let dailyHours = 8;

    if (travelStyle === "relaxed" || travelStyle === "luxury") {
        pace = "relaxed";
        dailyHours = 6;
    } else if (travelStyle === "adventure") {
        pace = "packed";
        dailyHours = 10;
    } else if (listing && ["Wellness", "Farms", "Houseboats", "Amazing Pools", "Mansions", "Casas particulares"].includes(listing.category)) {
        pace = "relaxed";
        dailyHours = 6;
    } else if (listing && ["Camping", "Mountains"].includes(listing.category)) {
        pace = "packed";
        dailyHours = 9;
    }

    let dailyStartTime = "09:00";
    if (sleepSchedule === "early_bird") {
        dailyStartTime = "07:30";
    } else if (sleepSchedule === "night_owl") {
        dailyStartTime = "10:30";
    } else if (pace === "packed") {
        dailyStartTime = "08:00";
    } else if (pace === "relaxed") {
        dailyStartTime = "09:30";
    }

    let travelMode = "driving";
    const amenities = Array.isArray(listing?.amenities) ? listing.amenities : [];
    if (listing && ["Iconic Cities", "Rooms", "Creative spaces"].includes(listing.category) && !amenities.includes("Free parking")) {
        travelMode = "transit";
    }

    return { pace, dailyHours, dailyStartTime, travelMode };
}

function buildPlannerPrefill({ booking = null, listing = null, user = null, queryDays = null }) {
    const activeListing = (booking && booking.listing) ? booking.listing : listing;
    const days = deriveStayDays({ booking, listing: activeListing, queryDays });
    const interests = deriveInterests({ listing: activeListing, booking, user });
    const { pace, dailyHours, dailyStartTime, travelMode } = deriveScheduleAndPace({ listing: activeListing, user });

    const destination = activeListing
        ? [activeListing.location, activeListing.country].filter(Boolean).join(", ")
        : "";

    let autoFillSummary = "";
    if (booking && activeListing) {
        autoFillSummary = `Auto-filled from your booked stay "${activeListing.title}" (${days} day${days === 1 ? "" : "s"}, ${booking.guests || 1} guest${(booking.guests || 1) === 1 ? "" : "s"})`;
    } else if (activeListing) {
        autoFillSummary = `Auto-filled from stay "${activeListing.title}" (${destination})`;
    }

    return {
        destination,
        days,
        dailyStartTime,
        dailyHours,
        pace,
        travelMode,
        interests,
        bookingId: booking ? booking._id.toString() : "",
        listingId: activeListing ? activeListing._id.toString() : "",
        stayTitle: activeListing ? activeListing.title : "",
        autoFillSummary
    };
}

module.exports.renderPlanner = async (req, res) => {
    const { bookingId = "", listingId = "", days: queryDays = "" } = req.query;
    let matchedBooking = null;
    let matchedListing = null;

    if (bookingId) {
        const booking = await Booking.findById(bookingId).populate("listing");
        if (booking && booking.guest && booking.guest.equals(req.user._id) && booking.listing) {
            matchedBooking = booking;
            matchedListing = booking.listing;
        }
    } else if (listingId) {
        matchedListing = await Listing.findById(listingId);
        if (matchedListing && !queryDays) {
            const activeBooking = await Booking.findOne({
                listing: matchedListing._id,
                guest: req.user._id,
                status: { $in: ["confirmed", "pending"] }
            }).populate("listing").sort({ checkIn: 1 });
            if (activeBooking) {
                matchedBooking = activeBooking;
            }
        }
    }

    const prefill = buildPlannerPrefill({
        booking: matchedBooking,
        listing: matchedListing,
        user: req.user,
        queryDays
    });

    res.render("itineraries/new.ejs", {
        prefill,
        interestsList: ITINERARY_INTERESTS,
        title: "AI Trip Itinerary Planner"
    });
};

module.exports.generateItinerary = async (req, res) => {
    const payload = req.body.itinerary || {};
    const interestsRaw = payload.interests;
    const interests = Array.isArray(interestsRaw)
        ? interestsRaw.filter(Boolean)
        : (typeof interestsRaw === "string" && interestsRaw.trim() ? [interestsRaw.trim()] : []);

    let startCoordinates = [78.4867, 17.3850];
    let linkedBooking = null;
    let linkedListing = null;

    if (payload.bookingId) {
        const booking = await Booking.findById(payload.bookingId).populate("listing");
        if (booking && booking.guest && booking.guest.equals(req.user._id)) {
            linkedBooking = booking._id;
            if (booking.listing) {
                linkedListing = booking.listing._id;
                if (booking.listing.geometry && Array.isArray(booking.listing.geometry.coordinates) && booking.listing.geometry.coordinates.length === 2) {
                    startCoordinates = booking.listing.geometry.coordinates;
                }
            }
        }
    } else if (payload.listingId) {
        const listing = await Listing.findById(payload.listingId);
        if (listing) {
            linkedListing = listing._id;
            if (listing.geometry && Array.isArray(listing.geometry.coordinates) && listing.geometry.coordinates.length === 2) {
                startCoordinates = listing.geometry.coordinates;
            }
        }
    }

    const plan = await generatePersonalizedItinerary({
        destination: payload.destination,
        days: Number(payload.days),
        dailyHours: Number(payload.dailyHours || 8),
        dailyStartTime: payload.dailyStartTime || "09:00",
        pace: payload.pace || "balanced",
        travelMode: payload.travelMode || "driving",
        interests,
        startCoordinates
    });

    const itinerary = new TripItinerary({
        user: req.user._id,
        booking: linkedBooking,
        listing: linkedListing,
        destination: plan.destination,
        startCoordinates: plan.startCoordinates,
        days: plan.days,
        dailyStartTime: plan.dailyStartTime,
        dailyHours: plan.dailyHours,
        pace: plan.pace,
        travelMode: plan.travelMode,
        interests: plan.interests,
        sourceProvider: plan.sourceProvider,
        totalDistanceKm: plan.totalDistanceKm,
        totalTravelMins: plan.totalTravelMins,
        dayPlans: plan.dayPlans
    });

    await itinerary.save();
    res.redirect(`/itineraries/${itinerary._id}`);
};

module.exports.listItineraries = async (req, res) => {
    const itineraries = await TripItinerary.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .populate("listing", "title location");
    res.render("itineraries/index.ejs", {
        itineraries,
        title: "Saved AI Itineraries"
    });
};

module.exports.showItinerary = async (req, res) => {
    const itinerary = await TripItinerary.findById(req.params.id).populate("listing booking");
    if (!itinerary) {
        throw new ExpressError(404, "Itinerary not found.");
    }
    if (!itinerary.user.equals(req.user._id)) {
        req.flash("error", "You do not have permission to view this itinerary.");
        return res.redirect("/itineraries");
    }

    res.render("itineraries/show.ejs", {
        itinerary,
        title: `${itinerary.destination} (${itinerary.days}-Day Itinerary)`
    });
};

module.exports.deleteItinerary = async (req, res) => {
    const itinerary = await TripItinerary.findById(req.params.id);
    if (!itinerary) {
        req.flash("error", "Itinerary not found.");
        return res.redirect("/itineraries");
    }
    if (!itinerary.user.equals(req.user._id)) {
        req.flash("error", "You do not have permission to delete this itinerary.");
        return res.redirect("/itineraries");
    }
    await TripItinerary.findByIdAndDelete(itinerary._id);
    req.flash("success", "Itinerary deleted.");
    res.redirect("/itineraries");
};
