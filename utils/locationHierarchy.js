/**
 * Parses a listing's `location` string (typically "City, State" or "Area, City, State")
 * and country fallback into normalized `{ city, state }` fields.
 */
function parseListingLocation(location = "", country = "") {
    const rawParts = String(location || "")
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);

    if (rawParts.length >= 2) {
        return {
            city: rawParts.slice(0, -1).join(", "),
            state: rawParts[rawParts.length - 1]
        };
    }
    if (rawParts.length === 1) {
        return {
            city: rawParts[0],
            state: String(country || "").trim() || rawParts[0]
        };
    }
    return {
        city: "General",
        state: String(country || "").trim() || "Other"
    };
}

/**
 * Builds a structured State -> City -> Stay hierarchy strictly from the provided listings array.
 * Only states and cities that actually contain listings are included.
 */
function buildLocationTree(listings = []) {
    const stateSet = new Set();
    const citySetsByState = {};
    const stays = [];

    for (const listing of listings || []) {
        if (!listing || !listing._id) continue;
        const { city, state } = parseListingLocation(listing.location, listing.country);
        stateSet.add(state);
        if (!citySetsByState[state]) {
            citySetsByState[state] = new Set();
        }
        citySetsByState[state].add(city);

        stays.push({
            _id: String(listing._id),
            title: listing.title || "Untitled Stay",
            location: listing.location || "",
            country: listing.country || "",
            category: listing.category || "Rooms",
            price: Number(listing.price || 0),
            maxGuests: Number(listing.maxGuests || 4),
            state,
            city
        });
    }

    const states = Array.from(stateSet).sort((a, b) => a.localeCompare(b));
    const citiesByState = {};
    for (const state of states) {
        citiesByState[state] = Array.from(citySetsByState[state]).sort((a, b) => a.localeCompare(b));
    }

    return { states, citiesByState, stays };
}

/**
 * Resolves initial `{ state, city, listingId }` selection from an already attached listing
 * or an exact/clear substring match on the pool's destination text.
 */
function findInitialSelection({ tree, destination = "", selectedListing = null }) {
    if (!tree || !Array.isArray(tree.stays) || tree.stays.length === 0) {
        return { state: "", city: "", listingId: "" };
    }

    if (selectedListing && selectedListing._id) {
        const matchById = tree.stays.find((s) => s._id === String(selectedListing._id));
        if (matchById) {
            return {
                state: matchById.state,
                city: matchById.city,
                listingId: matchById._id
            };
        }
    }

    const destLower = String(destination || "").trim().toLowerCase();
    if (!destLower) {
        return { state: "", city: "", listingId: "" };
    }

    const destPrimary = destLower.split(",")[0].trim();
    const cityMatch = tree.stays.find(
        (s) => s.city.toLowerCase() === destPrimary || s.city.toLowerCase().includes(destPrimary)
    );
    if (cityMatch) {
        return { state: cityMatch.state, city: cityMatch.city, listingId: "" };
    }

    const stateMatch = tree.states.find((st) => st.toLowerCase() === destLower || st.toLowerCase().includes(destLower));
    if (stateMatch) {
        return { state: stateMatch, city: "", listingId: "" };
    }

    return { state: "", city: "", listingId: "" };
}

module.exports = {
    parseListingLocation,
    buildLocationTree,
    findInitialSelection
};
