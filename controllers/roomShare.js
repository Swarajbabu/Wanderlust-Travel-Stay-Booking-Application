const crypto = require("crypto");
const Listing = require("../modals/listing");
const Booking = require("../modals/booking");
const RoomSharePool = require("../modals/roomShare");
const ExpressError = require("../utility/ExpressError");
const logger = require("../config/logger");
const { getRazorpayInstance, activeBookingFilter, calculateBookingPricing } = require("../utility/bookingHelpers");
const { scorePoolCompatibility } = require("../services/companionMatcher");
const { buildLocationTree, findInitialSelection } = require("../utils/locationHierarchy");

const POOL_PAYMENT_LOCK_TTL_MS = 30 * 60 * 1000;
const razorpayInstance = getRazorpayInstance();

function escapeRegex(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function activePoolFilter(extra = {}) {
    const now = new Date();
    return {
        ...extra,
        $or: [
            { status: "confirmed" },
            { status: { $in: ["locked", "partially_booked"] }, expiresAt: null },
            { status: { $in: ["locked", "partially_booked"] }, expiresAt: { $gt: now } }
        ]
    };
}

function getAcceptedParticipants(pool) {
    return (pool.participants || []).filter((p) => p.joinStatus === "accepted");
}

function isAcceptedMember(pool, userId) {
    if (!userId) return false;
    return (pool.participants || []).some(
        (p) => p.user && p.user._id
            ? p.user._id.equals(userId) && p.joinStatus === "accepted"
            : p.user && p.user.equals && p.user.equals(userId) && p.joinStatus === "accepted"
    );
}

function canParticipateInChat(pool, userId) {
    if (!userId) return false;
    if (pool.initiator && ((pool.initiator._id && pool.initiator._id.equals(userId)) || (pool.initiator.equals && pool.initiator.equals(userId)))) {
        return true;
    }
    return (pool.participants || []).some((p) => {
        const pUser = p.user && p.user._id ? p.user._id : p.user;
        return pUser && pUser.equals && pUser.equals(userId) && ["pending", "accepted"].includes(p.joinStatus);
    });
}

function getPoolPaymentSummary(pool) {
    const accepted = getAcceptedParticipants(pool);
    const paidMembers = accepted.filter((p) => p.paymentStatus === "paid");
    const paidAmount = paidMembers.reduce((sum, p) => sum + Number(p.amountDue || 0), 0);
    const totalAmount = Number(pool.totalPrice || 0);
    return {
        acceptedCount: accepted.length,
        paidCount: paidMembers.length,
        unpaidCount: Math.max(0, accepted.length - paidMembers.length),
        paidAmount,
        remainingAmount: Math.max(0, totalAmount - paidAmount)
    };
}

module.exports.listRoomShares = async (req, res) => {
    const {
        state = "",
        city = "",
        destination = "",
        category = "",
        checkIn = "",
        checkOut = "",
        maxBudget = "",
        companionGender = "",
        create = ""
    } = req.query;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const listingQuery = {
        allowRoomSharing: true,
        maxGuests: { $gte: 2 }
    };
    if (req.user) {
        listingQuery.owner = { $ne: req.user._id };
    }

    const myPoolsPromise = req.user
        ? RoomSharePool.find({
            "participants.user": req.user._id,
            status: { $in: ["open", "locked", "partially_booked", "confirmed"] },
            checkOut: { $gte: now }
        })
            .populate("listing", "title location country price image maxGuests allowRoomSharing category")
            .populate("initiator", "username emailVerified")
            .sort({ createdAt: -1 })
            .limit(12)
        : Promise.resolve([]);

    const [pools, shareableListings, allLocationListings, myActivePools] = await Promise.all([
        RoomSharePool.find({
            status: "open",
            checkOut: { $gte: now }
        })
            .populate("listing", "title location country price image maxGuests allowRoomSharing category")
            .populate("initiator", "username emailVerified travelProfile")
            .sort({ checkIn: 1 })
            .limit(60),
        Listing.find(listingQuery)
            .select("title location country price category maxGuests")
            .sort({ category: 1, title: 1 })
            .limit(120),
        Listing.find({ allowRoomSharing: true, maxGuests: { $gte: 2 } })
            .select("title location country category price maxGuests")
            .sort({ location: 1, title: 1 }),
        myPoolsPromise
    ]);

    const searchCriteria = {
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        maxBudget: maxBudget ? Number(maxBudget) : 0
    };

    const stateTerm = state.trim().toLowerCase();
    const cityTerm = city.trim().toLowerCase();
    const destTerm = destination.trim().toLowerCase();

    const matchedPools = pools
        .filter((pool) => pool.listing || pool.destination)
        .filter((pool) => {
            if (!category) return true;
            const poolCat = (pool.listing && pool.listing.category) || (pool.preferences && pool.preferences.category) || "";
            return poolCat === category;
        })
        .filter((pool) => {
            if (!stateTerm && !cityTerm && !destTerm) return true;
            const hay = [
                pool.destination || "",
                pool.listing ? pool.listing.title : "",
                pool.listing ? pool.listing.location : "",
                pool.listing ? pool.listing.country : "",
                pool.preferences ? (pool.preferences.category || "") : ""
            ].join(" ").toLowerCase();
            if (stateTerm && !hay.includes(stateTerm)) return false;
            if (cityTerm && !hay.includes(cityTerm)) return false;
            if (destTerm && !hay.includes(destTerm)) return false;
            return true;
        })
        .filter((pool) => {
            if (!searchCriteria.maxBudget) return true;
            const effectiveSplit = pool.listing
                ? Number(pool.pricePerPerson || 0)
                : Number((pool.preferences && pool.preferences.maxBudget) || 0);
            if (!effectiveSplit) return true;
            return effectiveSplit <= searchCriteria.maxBudget;
        })
        .filter((pool) => {
            if (!companionGender) return true;
            return pool.preferences?.companionGender === companionGender;
        })
        .map((pool) => {
            const match = scorePoolCompatibility(req.user || null, pool, searchCriteria);
            const acceptedCount = getAcceptedParticipants(pool).length;
            const spotsRemaining = Math.max(0, pool.maxParticipants - acceptedCount);
            const isInitiator = Boolean(req.user && pool.initiator && pool.initiator._id && pool.initiator._id.equals(req.user._id));
            const isMember = Boolean(req.user && isAcceptedMember(pool, req.user._id));
            return { pool, match, acceptedCount, spotsRemaining, isOwnPool: isInitiator || isMember };
        })
        .filter((entry) => entry.spotsRemaining > 0 && (!req.user || entry.isOwnPool || entry.match.compatible))
        .sort((a, b) => {
            if (a.isOwnPool !== b.isOwnPool) return a.isOwnPool ? -1 : 1;
            return b.match.score - a.match.score;
        });

    const hubLocationTree = buildLocationTree(shareableListings);
    const allLocationTree = buildLocationTree(allLocationListings);

    res.render("roomShares/index.ejs", {
        matchedPools,
        myActivePools,
        shareableListings,
        hubLocationTree,
        allLocationTree,
        categories: Listing.CATEGORIES || [],
        filters: { state, city, destination, category, checkIn, checkOut, maxBudget, companionGender },
        openCreateForm: create === "1" || create === "true",
        title: "Solo Room Shares & Companion Match"
    });
};

async function handleCreatePoolForListing({ req, res, listing, errorRedirectUrl, successRedirectBuilder }) {
    if (!listing.allowRoomSharing || Number(listing.maxGuests || 1) < 2) {
        req.flash("error", "Room sharing is not enabled on this listing.");
        return res.redirect(errorRedirectUrl);
    }
    if (listing.owner && listing.owner.equals(req.user._id)) {
        req.flash("error", "You cannot open a room share on your own listing.");
        return res.redirect(errorRedirectUrl);
    }

    const { category, checkIn, checkOut, maxParticipants, companionGender, smokingPreference, sleepSchedule, note, maxBudget } = req.body.share;
    const reqIn = new Date(checkIn);
    const reqOut = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (reqIn < today) {
        req.flash("error", "Check-in date cannot be in the past.");
        return res.redirect(errorRedirectUrl);
    }

    const spots = Number(maxParticipants);
    const listingCap = Number(listing.maxGuests || 4);
    if (spots < 2 || spots > listingCap) {
        req.flash("error", `Share group size must be between 2 and ${listingCap} guests.`);
        return res.redirect(errorRedirectUrl);
    }

    const id = listing._id;
    const [bookingConflict, poolConflict] = await Promise.all([
        Booking.findOne(activeBookingFilter({
            listing: id,
            checkIn: { $lt: reqOut },
            checkOut: { $gt: reqIn }
        })),
        RoomSharePool.findOne(activePoolFilter({
            listing: id,
            checkIn: { $lt: reqOut },
            checkOut: { $gt: reqIn }
        }))
    ]);

    if (bookingConflict || poolConflict) {
        req.flash("error", "Selected dates overlap with an existing confirmed or locked reservation.");
        return res.redirect(errorRedirectUrl);
    }

    const { basePrice, taxAmount, totalPrice } = calculateBookingPricing(reqIn, reqOut, listing.price);
    const pricePerPerson = Math.ceil(totalPrice / spots);
    const derivedDestination = [listing.location, listing.country].filter(Boolean).join(", ");

    const pool = new RoomSharePool({
        listing: id,
        destination: derivedDestination,
        initiator: req.user._id,
        checkIn: reqIn,
        checkOut: reqOut,
        maxParticipants: spots,
        basePrice,
        taxAmount,
        totalPrice,
        pricePerPerson,
        status: "open",
        preferences: {
            category: (category && String(category).trim()) || listing.category || "",
            maxBudget: Number(maxBudget || 0) || 0,
            companionGender: companionGender || "any",
            smokingPreference: smokingPreference || "no_preference",
            sleepSchedule: sleepSchedule || "flexible",
            note: note ? String(note).trim() : ""
        },
        participants: [{
            user: req.user._id,
            role: "initiator",
            joinStatus: "accepted",
            paymentStatus: "unpaid",
            amountDue: pricePerPerson,
            introMessage: note ? String(note).trim().slice(0, 300) : "Room share initiator"
        }]
    });

    await pool.save();
    req.flash("success", `Solo room-share posted for "${listing.title}"! Estimated split: Rs. ${pricePerPerson.toLocaleString("en-IN")} per traveller.`);
    return res.redirect(successRedirectBuilder(pool));
}

module.exports.renderCreatePool = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id).populate("owner", "username");
    if (!listing) {
        req.flash("error", "Listing not found.");
        return res.redirect("/listings");
    }
    if (!listing.allowRoomSharing || Number(listing.maxGuests || 1) < 2) {
        req.flash("error", "This host has not enabled solo room sharing for this stay.");
        return res.redirect(`/listings/${id}`);
    }
    if (listing.owner && listing.owner._id.equals(req.user._id)) {
        req.flash("error", "Hosts cannot open a solo guest room share on their own listing.");
        return res.redirect(`/listings/${id}`);
    }

    res.render("roomShares/new.ejs", {
        listing,
        title: `Start Room Share · ${listing.title}`
    });
};

module.exports.createPool = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        throw new ExpressError(404, "Listing Not Found");
    }
    return handleCreatePoolForListing({
        req,
        res,
        listing,
        errorRedirectUrl: `/listings/${id}/room-shares/new`,
        successRedirectBuilder: (pool) => `/room-shares/${pool._id}`
    });
};

module.exports.createPoolFromHub = async (req, res) => {
    const { listingId, state, city, destination, category, maxBudget, checkIn, checkOut, maxParticipants, companionGender, smokingPreference, sleepSchedule, note } = req.body.share || {};
    let listing = null;

    if (listingId) {
        listing = await Listing.findById(listingId);
        if (!listing) {
            req.flash("error", "Selected stay was not found.");
            return res.redirect("/room-shares?create=1");
        }
        return handleCreatePoolForListing({
            req,
            res,
            listing,
            errorRedirectUrl: "/room-shares?create=1",
            successRedirectBuilder: () => "/room-shares"
        });
    }

    const derivedStateCity = [city, state].map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean).join(", ");
    const rawDest = typeof destination === "string" && destination.trim() ? destination.trim() : derivedStateCity;
    const cleanDest = rawDest.trim();
    if (!cleanDest || cleanDest.length < 2) {
        req.flash("error", "Please select a State and City (or pick a stay).");
        return res.redirect("/room-shares?create=1");
    }

    const reqIn = new Date(checkIn);
    const reqOut = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (reqIn < today) {
        req.flash("error", "Check-in date cannot be in the past.");
        return res.redirect("/room-shares?create=1");
    }

    const spots = Math.min(10, Math.max(2, Number(maxParticipants) || 2));
    const budgetNum = Number(maxBudget || 0) || 0;

    const pool = new RoomSharePool({
        listing: null,
        destination: cleanDest,
        initiator: req.user._id,
        checkIn: reqIn,
        checkOut: reqOut,
        maxParticipants: spots,
        basePrice: 0,
        taxAmount: 0,
        totalPrice: 0,
        pricePerPerson: budgetNum,
        status: "open",
        preferences: {
            category: category ? String(category).trim() : "",
            maxBudget: budgetNum,
            companionGender: companionGender || "any",
            smokingPreference: smokingPreference || "no_preference",
            sleepSchedule: sleepSchedule || "flexible",
            note: note ? String(note).trim() : ""
        },
        participants: [{
            user: req.user._id,
            role: "initiator",
            joinStatus: "accepted",
            paymentStatus: "unpaid",
            amountDue: 0,
            introMessage: note ? String(note).trim().slice(0, 300) : `Looking for solo companions in ${cleanDest}`
        }]
    });

    await pool.save();
    req.flash("success", `Solo trip request posted for "${cleanDest}"! Other travellers visiting ${cleanDest} on matching dates can now connect and chat with you.`);
    return res.redirect("/room-shares");
};

module.exports.selectStayForPool = async (req, res) => {
    const { poolId } = req.params;
    const { listingId } = req.body;
    const pool = await RoomSharePool.findById(poolId);
    if (!pool) {
        throw new ExpressError(404, "Room share pool not found");
    }
    if (!pool.initiator.equals(req.user._id)) {
        req.flash("error", "Only the trip organizer can select or change the stay.");
        return res.redirect(`/room-shares/${poolId}`);
    }
    if (pool.status !== "open") {
        req.flash("error", "Cannot change stay after the group is locked for payment.");
        return res.redirect(`/room-shares/${poolId}`);
    }

    const listing = await Listing.findById(listingId);
    if (!listing || !listing.allowRoomSharing || Number(listing.maxGuests || 1) < 2) {
        req.flash("error", "Please pick a share-enabled stay.");
        return res.redirect(`/room-shares/${poolId}`);
    }
    if (listing.owner && listing.owner.equals(req.user._id)) {
        req.flash("error", "You cannot select a listing you own for solo split booking.");
        return res.redirect(`/room-shares/${poolId}`);
    }

    const [bookingConflict, poolConflict] = await Promise.all([
        Booking.findOne(activeBookingFilter({
            listing: listing._id,
            checkIn: { $lt: pool.checkOut },
            checkOut: { $gt: pool.checkIn }
        })),
        RoomSharePool.findOne(activePoolFilter({
            _id: { $ne: pool._id },
            listing: listing._id,
            checkIn: { $lt: pool.checkOut },
            checkOut: { $gt: pool.checkIn }
        }))
    ]);
    if (bookingConflict || poolConflict) {
        req.flash("error", "That stay already has a reservation overlapping these dates. Pick another stay.");
        return res.redirect(`/room-shares/${poolId}`);
    }

    const acceptedCount = Math.max(2, getAcceptedParticipants(pool).length);
    const { basePrice, taxAmount, totalPrice } = calculateBookingPricing(pool.checkIn, pool.checkOut, listing.price);
    const perPerson = Math.ceil(totalPrice / acceptedCount);

    pool.listing = listing._id;
    pool.destination = [listing.location, listing.country].filter(Boolean).join(", ");
    pool.basePrice = basePrice;
    pool.taxAmount = taxAmount;
    pool.totalPrice = totalPrice;
    pool.pricePerPerson = perPerson;
    if (listing.category && !pool.preferences.category) {
        pool.preferences.category = listing.category;
    }
    (pool.participants || []).forEach((p) => {
        if (p.joinStatus === "accepted") p.amountDue = perPerson;
    });

    await pool.save();
    req.flash("success", `Selected "${listing.title}" (Total Rs. ${totalPrice.toLocaleString("en-IN")} | Est. Rs. ${perPerson.toLocaleString("en-IN")} per person). Lock when everyone is ready to pay.`);
    return res.redirect(`/room-shares/${poolId}`);
};

module.exports.showPool = async (req, res) => {
    const { poolId } = req.params;
    const pool = await RoomSharePool.findById(poolId)
        .populate({
            path: "listing",
            populate: { path: "owner", select: "username" }
        })
        .populate("initiator", "username emailVerified travelProfile bio")
        .populate("cancelledBy", "username")
        .populate("participants.user", "username emailVerified travelProfile bio")
        .populate("messages.sender", "username");

    if (!pool) {
        req.flash("error", "Room share pool not found.");
        return res.redirect("/room-shares");
    }

    const accepted = getAcceptedParticipants(pool);
    const pendingRequests = (pool.participants || []).filter((p) => p.joinStatus === "pending");
    const isInitiator = Boolean(req.user && pool.initiator && pool.initiator._id.equals(req.user._id));
    const currentParticipant = req.user
        ? (pool.participants || []).find((p) => p.user && p.user._id.equals(req.user._id) && p.joinStatus !== "left")
        : null;
    const canChat = Boolean(req.user && canParticipateInChat(pool, req.user._id));
    const isPaidMember = Boolean(currentParticipant && currentParticipant.joinStatus === "accepted" && currentParticipant.paymentStatus === "paid");
    const compatibility = req.user && !isInitiator
        ? scorePoolCompatibility(req.user, pool)
        : null;
    const paymentSummary = getPoolPaymentSummary(pool);

    let destinationStays = [];
    if (pool.status === "open" && (isInitiator || !pool.listing)) {
        const stayFilter = { allowRoomSharing: true, maxGuests: { $gte: 2 } };
        if (req.user) stayFilter.owner = { $ne: req.user._id };
        destinationStays = await Listing.find(stayFilter)
            .select("title location country price category maxGuests")
            .sort({ location: 1, price: 1 });
    }

    const locationTree = buildLocationTree(destinationStays);
    const initialStaySelection = findInitialSelection({
        tree: locationTree,
        destination: pool.destination,
        selectedListing: pool.listing
    });

    const participantsFingerprint = (pool.participants || []).map((p) => {
        const uId = p.user && p.user._id ? p.user._id.toString() : (p.user ? p.user.toString() : "");
        return `${uId}:${p.joinStatus}:${p.paymentStatus}:${p.amountDue || 0}`;
    }).join("|");

    const poolStateHash = [
        pool.status,
        pool.listing ? (pool.listing._id || pool.listing).toString() : "no_listing",
        Number(pool.totalPrice || 0),
        Number(pool.pricePerPerson || 0),
        participantsFingerprint,
        pool.booking ? pool.booking.toString() : "no_booking",
        pool.cancellationReason || ""
    ].join("::");

    res.render("roomShares/show.ejs", {
        pool,
        accepted,
        pendingRequests,
        isInitiator,
        currentParticipant,
        canChat,
        isPaidMember,
        compatibility,
        paymentSummary,
        destinationStays,
        locationTree,
        initialStaySelection,
        poolStateHash,
        title: `Room Share · ${pool.listing ? pool.listing.title : (pool.destination || "Details")}`
    });
};

module.exports.requestJoin = async (req, res) => {
    const { poolId } = req.params;
    const pool = await RoomSharePool.findById(poolId)
        .populate("listing", "owner maxGuests")
        .populate("initiator", "username emailVerified travelProfile");
    if (!pool) {
        throw new ExpressError(404, "Room share pool not found");
    }
    if (pool.status !== "open") {
        req.flash("error", "This room-share pool is no longer accepting new requests.");
        return res.redirect(`/room-shares/${poolId}`);
    }
    if (pool.listing && pool.listing.owner && pool.listing.owner.equals(req.user._id)) {
        req.flash("error", "Listing hosts cannot join guest room shares.");
        return res.redirect(`/room-shares/${poolId}`);
    }

    const existing = (pool.participants || []).find(
        (p) => p.user.equals(req.user._id) && ["pending", "accepted"].includes(p.joinStatus)
    );
    if (existing) {
        req.flash("error", "You already have an active request or seat in this pool.");
        return res.redirect(`/room-shares/${poolId}`);
    }

    const acceptedCount = getAcceptedParticipants(pool).length;
    if (acceptedCount >= pool.maxParticipants) {
        req.flash("error", "This room-share pool is already full.");
        return res.redirect(`/room-shares/${poolId}`);
    }

    const match = scorePoolCompatibility(req.user, pool);
    if (!match.compatible) {
        req.flash("error", match.reasons[0] || "Your travel preferences do not match this room-share pool.");
        return res.redirect(`/room-shares/${poolId}`);
    }

    pool.participants.push({
        user: req.user._id,
        role: "partner",
        joinStatus: "pending",
        paymentStatus: "unpaid",
        amountDue: pool.pricePerPerson,
        introMessage: req.body.introMessage ? String(req.body.introMessage).trim().slice(0, 300) : ""
    });

    await pool.save();
    req.flash("success", "Join request sent! The organizer will review your compatibility profile.");
    res.redirect(`/room-shares/${poolId}`);
};

module.exports.updateParticipantStatus = async (req, res) => {
    const { poolId, participantId } = req.params;
    const { action } = req.body;
    const pool = await RoomSharePool.findById(poolId);
    if (!pool) {
        throw new ExpressError(404, "Room share pool not found");
    }

    const participant = pool.participants.id(participantId);
    if (!participant) {
        throw new ExpressError(404, "Participant not found");
    }

    if (action === "leave") {
        if (!participant.user.equals(req.user._id) || participant.role === "initiator") {
            req.flash("error", "Only invited partners can leave this pool before payment.");
            return res.redirect(`/room-shares/${poolId}`);
        }
        if (pool.status !== "open" || participant.paymentStatus === "paid") {
            req.flash("error", "Cannot leave once pool payment is locked or paid.");
            return res.redirect(`/room-shares/${poolId}`);
        }
        participant.joinStatus = "left";
        await pool.save();
        req.flash("success", "You left the room-share pool.");
        return res.redirect(`/room-shares/${poolId}`);
    }

    if (!pool.initiator.equals(req.user._id)) {
        req.flash("error", "Only the room-share initiator can accept or reject requests.");
        return res.redirect(`/room-shares/${poolId}`);
    }
    if (pool.status !== "open") {
        req.flash("error", "Cannot modify participants after the pool is locked.");
        return res.redirect(`/room-shares/${poolId}`);
    }

    if (action === "accept") {
        const acceptedCount = getAcceptedParticipants(pool).length;
        if (acceptedCount >= pool.maxParticipants) {
            req.flash("error", "All spots in this pool are already filled.");
            return res.redirect(`/room-shares/${poolId}`);
        }
        participant.joinStatus = "accepted";
        const newCount = acceptedCount + 1;
        if (pool.totalPrice > 0) {
            pool.pricePerPerson = Math.ceil(pool.totalPrice / Math.max(2, newCount));
            participant.amountDue = pool.pricePerPerson;
        }
        await pool.save();
        req.flash("success", "Travel companion accepted! Lock the pool when everyone is ready to pay.");
    } else if (action === "reject") {
        participant.joinStatus = "rejected";
        await pool.save();
        req.flash("success", "Request declined.");
    } else {
        throw new ExpressError(400, "Invalid participant action.");
    }

    res.redirect(`/room-shares/${poolId}`);
};

module.exports.lockPool = async (req, res) => {
    const { poolId } = req.params;
    const pool = await RoomSharePool.findById(poolId);
    if (!pool) {
        throw new ExpressError(404, "Room share pool not found");
    }
    if (!pool.initiator.equals(req.user._id)) {
        req.flash("error", "Only the pool initiator can lock the room share for checkout.");
        return res.redirect(`/room-shares/${poolId}`);
    }
    if (pool.status !== "open") {
        req.flash("error", "This room-share pool is already locked or closed.");
        return res.redirect(`/room-shares/${poolId}`);
    }
    if (!pool.listing) {
        req.flash("error", "Please select a specific stay for your destination trip before locking for split payment.");
        return res.redirect(`/room-shares/${poolId}`);
    }

    const accepted = getAcceptedParticipants(pool);
    if (accepted.length < 2) {
        req.flash("error", "Accept at least one travel companion before locking for split payment.");
        return res.redirect(`/room-shares/${poolId}`);
    }

    const [bookingConflict, poolConflict] = await Promise.all([
        Booking.findOne(activeBookingFilter({
            listing: pool.listing,
            checkIn: { $lt: pool.checkOut },
            checkOut: { $gt: pool.checkIn }
        })),
        RoomSharePool.findOne(activePoolFilter({
            _id: { $ne: pool._id },
            listing: pool.listing,
            checkIn: { $lt: pool.checkOut },
            checkOut: { $gt: pool.checkIn }
        }))
    ]);

    if (bookingConflict || poolConflict) {
        req.flash("error", "Dates were reserved elsewhere. Please pick different dates.");
        return res.redirect(`/room-shares/${poolId}`);
    }

    const splitCount = accepted.length;
    const baseShare = Math.floor(pool.totalPrice / splitCount);
    const remainder = pool.totalPrice - baseShare * splitCount;

    accepted.forEach((p, idx) => {
        p.amountDue = baseShare + (idx === 0 ? remainder : 0);
    });
    pool.pricePerPerson = Math.ceil(pool.totalPrice / splitCount);
    pool.status = "locked";
    pool.expiresAt = new Date(Date.now() + POOL_PAYMENT_LOCK_TTL_MS);

    await pool.save();
    req.flash("success", "Group booking locked! Each member must pay their split share from their own account within 30 minutes to allot the room.");
    res.redirect(`/room-shares/${poolId}`);
};

module.exports.renderPoolCheckout = async (req, res) => {
    const { poolId } = req.params;
    const pool = await RoomSharePool.findById(poolId).populate("listing");
    if (!pool) {
        throw new ExpressError(404, "Room share pool not found");
    }
    if (!["locked", "partially_booked"].includes(pool.status)) {
        req.flash("error", pool.status === "open"
            ? "The initiator must lock the pool before payment."
            : `This pool is ${pool.status}.`);
        return res.redirect(`/room-shares/${poolId}`);
    }

    const participant = (pool.participants || []).find(
        (p) => p.user.equals(req.user._id) && p.joinStatus === "accepted"
    );
    if (!participant) {
        req.flash("error", "You are not an accepted participant in this pool.");
        return res.redirect(`/room-shares/${poolId}`);
    }
    if (participant.paymentStatus === "paid") {
        req.flash("success", "Your split share is already paid.");
        return res.redirect(`/room-shares/${poolId}`);
    }

    const options = {
        amount: participant.amountDue * 100,
        currency: "INR",
        receipt: `share_${pool._id.toString().slice(-10)}_${participant._id.toString().slice(-8)}`
    };
    const order = await razorpayInstance.orders.create(options);
    participant.razorpayOrderId = order.id;
    await pool.save();

    res.render("roomShares/checkout.ejs", {
        pool,
        participant,
        order,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        title: `Split Checkout · ${pool.listing ? pool.listing.title : "Room Share"}`
    });
};

module.exports.verifyPoolPayment = async (req, res) => {
    const { poolId } = req.params;
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    const pool = await RoomSharePool.findById(poolId);
    if (!pool) {
        throw new ExpressError(404, "Room share pool not found");
    }
    if (!["locked", "partially_booked"].includes(pool.status)) {
        req.flash("error", `This room share is currently ${pool.status}.`);
        return res.redirect(`/room-shares/${poolId}`);
    }

    const participant = (pool.participants || []).find(
        (p) => p.user.equals(req.user._id) && p.joinStatus === "accepted"
    );
    if (!participant) {
        throw new ExpressError(403, "Not an accepted participant in this pool.");
    }
    if (participant.razorpayOrderId && participant.razorpayOrderId !== razorpay_order_id) {
        throw new ExpressError(400, "Order ID mismatch during split payment verification.");
    }

    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated = hmac.digest("hex");

    if (generated !== razorpay_signature) {
        throw new ExpressError(400, "Split payment signature verification failed.");
    }

    participant.paymentStatus = "paid";
    participant.paymentId = razorpay_payment_id;
    participant.razorpayOrderId = razorpay_order_id;

    const accepted = getAcceptedParticipants(pool);
    const paidCount = accepted.filter((p) => p.paymentStatus === "paid").length;
    const allPaid = accepted.length >= 2 && paidCount === accepted.length;

    if (allPaid && !pool.booking) {
        const booking = new Booking({
            listing: pool.listing,
            guest: pool.initiator,
            checkIn: pool.checkIn,
            checkOut: pool.checkOut,
            guests: accepted.length,
            specialRequests: `Shared stay split among ${accepted.length} solo travellers`,
            basePrice: pool.basePrice,
            taxAmount: pool.taxAmount,
            totalPrice: pool.totalPrice,
            status: "confirmed",
            paymentId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id,
            isSharedBooking: true,
            roomSharePool: pool._id
        });
        await booking.save();
        pool.booking = booking._id;
        pool.status = "confirmed";
        pool.expiresAt = null;
    } else if (paidCount >= 1) {
        pool.status = "partially_booked";
    }

    await pool.save();
    req.flash(
        "success",
        allPaid
            ? "All companions paid! Shared room booking is confirmed and the room is allotted."
            : `Your split payment of Rs. ${Number(participant.amountDue).toLocaleString("en-IN")} is received! Status: Partially Booked (room not allotted until remaining member pays).`
    );
    res.redirect(`/room-shares/${poolId}`);
};

module.exports.cancelPool = async (req, res) => {
    const { poolId } = req.params;
    const pool = await RoomSharePool.findById(poolId);
    if (!pool) {
        throw new ExpressError(404, "Room share pool not found");
    }

    const isInitiator = pool.initiator.equals(req.user._id);
    const isPaidMember = (pool.participants || []).some(
        (p) => p.user.equals(req.user._id) && p.joinStatus === "accepted" && p.paymentStatus === "paid"
    );
    const canPaidMemberCancel = isPaidMember && ["locked", "partially_booked"].includes(pool.status);

    if (!isInitiator && !canPaidMemberCancel) {
        req.flash("error", "Only the initiator or a paid member waiting on a companion can cancel this room share.");
        return res.redirect(`/room-shares/${poolId}`);
    }
    if (pool.status === "cancelled") {
        req.flash("error", "This room share is already cancelled.");
        return res.redirect(`/room-shares/${poolId}`);
    }

    const rawReason = req.body && req.body.cancellationReason !== undefined
        ? String(req.body.cancellationReason).trim()
        : null;
    if ((rawReason !== null && rawReason.length < 5) || (pool.status === "partially_booked" && (!rawReason || rawReason.length < 5))) {
        req.flash("error", "Please select or enter a cancellation reason (at least 5 characters).");
        return res.redirect(req.get("Referrer") || `/room-shares/${poolId}`);
    }
    const finalReason = rawReason
        ? rawReason.slice(0, 500)
        : (isInitiator ? "Cancelled by room-share organizer" : "Cancelled due to companion non-response");

    for (const p of pool.participants) {
        if (p.paymentStatus === "paid" && p.paymentId) {
            try {
                const refund = await razorpayInstance.payments.refund(p.paymentId, {
                    amount: p.amountDue * 100,
                    notes: { pool_id: pool._id.toString(), reason: finalReason }
                });
                p.paymentStatus = "refunded";
                p.refundId = refund && refund.id ? refund.id : null;
            } catch (err) {
                logger.error(`Split refund failed for participant ${p._id}: ${err.message}`);
            }
        }
    }

    if (pool.booking) {
        await Booking.findByIdAndUpdate(pool.booking, {
            status: "cancelled",
            cancellationReason: finalReason,
            cancelledBy: req.user._id,
            cancelledAt: new Date()
        });
    }

    pool.status = "cancelled";
    pool.cancellationReason = finalReason;
    pool.cancelledBy = req.user._id;
    pool.cancelledAt = new Date();
    pool.expiresAt = null;
    await pool.save();

    req.flash("success", `Room-share request cancelled (${finalReason}) and any paid shares have been refunded.`);
    res.redirect(req.get("Referrer") && req.get("Referrer").includes("/bookings") ? "/bookings" : `/room-shares/${poolId}`);
};

module.exports.getMessagesJson = async (req, res) => {
    const { poolId } = req.params;
    const pool = await RoomSharePool.findById(poolId).populate("messages.sender", "username");
    if (!pool) {
        return res.status(404).json({ error: "Room share pool not found" });
    }
    if (!canParticipateInChat(pool, req.user._id)) {
        return res.status(403).json({ error: "Access denied" });
    }
    const formatted = (pool.messages || []).map((m) => ({
        _id: m._id,
        sender: m.sender ? m.sender.username : "member",
        text: m.text,
        createdAt: m.createdAt
    }));
    return res.json({ messages: formatted });
};

module.exports.postMessage = async (req, res) => {
    const { poolId } = req.params;
    const { text } = req.body;
    const wantsJson = Boolean(req.xhr || req.is("json") || (req.headers.accept && req.headers.accept.includes("application/json")));
    const pool = await RoomSharePool.findById(poolId);
    if (!pool) {
        if (wantsJson) return res.status(404).json({ error: "Room share pool not found" });
        throw new ExpressError(404, "Room share pool not found");
    }
    if (!canParticipateInChat(pool, req.user._id)) {
        if (wantsJson) return res.status(403).json({ error: "Send a join request first to chat with companions." });
        req.flash("error", "Send a join request or wait for access before using pool chat.");
        return res.redirect(`/room-shares/${poolId}`);
    }
    const cleanText = typeof text === "string" ? text.trim().slice(0, 500) : "";
    if (!cleanText) {
        if (wantsJson) return res.status(400).json({ error: "Please enter a message." });
        req.flash("error", "Please enter a message.");
        return res.redirect(`/room-shares/${poolId}`);
    }

    pool.messages.push({ sender: req.user._id, text: cleanText });
    await pool.save();

    if (wantsJson) {
        const added = pool.messages[pool.messages.length - 1];
        return res.status(201).json({
            success: true,
            message: {
                _id: added._id,
                sender: req.user.username,
                text: added.text,
                createdAt: added.createdAt
            }
        });
    }
    res.redirect(`/room-shares/${poolId}`);
};

module.exports.syncPoolStateJson = async (req, res) => {
    const { poolId } = req.params;
    const pool = await RoomSharePool.findById(poolId)
        .populate("listing", "title location country price")
        .populate("initiator", "username emailVerified")
        .populate("cancelledBy", "username")
        .populate("participants.user", "username emailVerified")
        .populate("messages.sender", "username");

    if (!pool) {
        return res.status(404).json({ error: "Room share pool not found" });
    }

    const accepted = getAcceptedParticipants(pool);
    const isInitiator = Boolean(req.user && pool.initiator && pool.initiator._id.equals(req.user._id));
    const currentParticipant = req.user
        ? (pool.participants || []).find((p) => p.user && p.user._id && p.user._id.equals(req.user._id) && p.joinStatus !== "left")
        : null;
    const canChat = Boolean(req.user && canParticipateInChat(pool, req.user._id));
    const isPaidMember = Boolean(currentParticipant && currentParticipant.joinStatus === "accepted" && currentParticipant.paymentStatus === "paid");
    const paymentSummary = getPoolPaymentSummary(pool);

    const participantsFingerprint = (pool.participants || []).map((p) => {
        const uId = p.user && p.user._id ? p.user._id.toString() : (p.user ? p.user.toString() : "");
        return `${uId}:${p.joinStatus}:${p.paymentStatus}:${p.amountDue || 0}`;
    }).join("|");

    const stateHash = [
        pool.status,
        pool.listing ? (pool.listing._id || pool.listing).toString() : "no_listing",
        Number(pool.totalPrice || 0),
        Number(pool.pricePerPerson || 0),
        participantsFingerprint,
        pool.booking ? pool.booking.toString() : "no_booking",
        pool.cancellationReason || ""
    ].join("::");

    const formattedMessages = canChat
        ? (pool.messages || []).map((m) => ({
            _id: m._id,
            sender: m.sender ? m.sender.username : "member",
            text: m.text,
            createdAt: m.createdAt
        }))
        : [];

    return res.json({
        poolId: pool._id,
        status: pool.status,
        stateHash,
        listing: pool.listing ? {
            _id: pool.listing._id,
            title: pool.listing.title,
            location: pool.listing.location,
            country: pool.listing.country,
            price: pool.listing.price
        } : null,
        destination: pool.destination,
        totalPrice: pool.totalPrice,
        pricePerPerson: pool.pricePerPerson,
        paymentSummary,
        canChat,
        canCancel: (isInitiator && pool.status !== 'cancelled') || (isPaidMember && ['locked', 'partially_booked'].includes(pool.status)),
        isInitiator,
        isPaidMember,
        myParticipantStatus: currentParticipant ? {
            joinStatus: currentParticipant.joinStatus,
            paymentStatus: currentParticipant.paymentStatus,
            amountDue: currentParticipant.amountDue
        } : null,
        messages: formattedMessages
    });
};
