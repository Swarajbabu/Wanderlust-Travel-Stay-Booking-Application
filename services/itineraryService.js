const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const logger = require("../config/logger");
const { callGeminiJson } = require("../utility/geminiClient");

const DEFAULT_COORDINATES = [78.4867, 17.3850];

const DESTINATION_CATALOG = {
    manali: [
        { name: "Hadimba Devi Temple", category: "Culture", description: "Ancient cedar-wood pagoda temple nestled inside Dhungri forest.", durationMins: 75, bestTimeOfDay: "morning", coordinates: [77.1804, 32.2484], tips: "Visit before 10 AM to enjoy quiet forest trails." },
        { name: "Solang Valley", category: "Adventure", description: "Alpine valley famous for paragliding, ropeway rides, and mountain panoramas.", durationMins: 150, bestTimeOfDay: "morning", coordinates: [77.1572, 32.3164], tips: "Carry a windproof jacket; morning slots have clearer skies." },
        { name: "Old Manali & Manu Temple", category: "Food", description: "Bohemian hillside lane with riverside cafes, bakeries, and traditional wooden homes.", durationMins: 105, bestTimeOfDay: "afternoon", coordinates: [77.1771, 32.2572], tips: "Great spot for local Himachali lunch and coffee." },
        { name: "Vashisht Hot Water Springs", category: "Wellness", description: "Natural thermal springs overlooking the Beas river valley.", durationMins: 75, bestTimeOfDay: "afternoon", coordinates: [77.1873, 32.2654], tips: "Walk across from Old Manali or take a quick auto ride." },
        { name: "Jogini Waterfall Trail", category: "Nature", description: "Scenic waterfall hike passing pine orchards and terraced farms.", durationMins: 120, bestTimeOfDay: "morning", coordinates: [77.1912, 32.2751], tips: "Wear sturdy grip shoes for damp stone steps." },
        { name: "Mall Road & Tibetan Monastery", category: "Shopping", description: "Evening promenade for Kullu shawls, handicrafts, and momos.", durationMins: 90, bestTimeOfDay: "evening", coordinates: [77.1892, 32.2432], tips: "Ideal sunset stroll and dinner stop." },
        { name: "Naggar Castle & Roerich Art Gallery", category: "Heritage", description: "16th-century stone-and-timber castle overlooking the Kullu valley.", durationMins: 120, bestTimeOfDay: "afternoon", coordinates: [77.1636, 32.1145], tips: "Combine with a riverside trout lunch on the way back." },
        { name: "Van Vihar National Park", category: "Nature", description: "Peaceful deodar cedar reserve right beside the Beas river.", durationMins: 60, bestTimeOfDay: "evening", coordinates: [77.1886, 32.2389], tips: "Best for golden-hour photography." }
    ],
    goa: [
        { name: "Fort Aguada & Lighthouse", category: "Heritage", description: "17th-century Portuguese sea fort overlooking the Arabian Sea.", durationMins: 90, bestTimeOfDay: "morning", coordinates: [73.7736, 15.4920], tips: "Go early to beat midday coastal heat." },
        { name: "Fontainhas Latin Quarter", category: "Culture", description: "UNESCO-listed pastel-colored heritage lanes in Panaji.", durationMins: 90, bestTimeOfDay: "morning", coordinates: [73.8303, 15.4981], tips: "Stop at a traditional Goan bakery along the walk." },
        { name: "Baga & Calangute Coastal Stretch", category: "Adventure", description: "Lively shoreline with water sports and seaside shacks.", durationMins: 120, bestTimeOfDay: "afternoon", coordinates: [73.7517, 15.5553], tips: "Book parasailing before 4 PM." },
        { name: "Chapora Fort Sunset Point", category: "Photography", description: "Cliffside fort offering sweeping views of Vagator beach.", durationMins: 75, bestTimeOfDay: "evening", coordinates: [73.7365, 15.6056], tips: "Arrive 30 minutes before sunset." },
        { name: "Basilica of Bom Jesus", category: "Culture", description: "Baroque church monument in Old Goa.", durationMins: 75, bestTimeOfDay: "morning", coordinates: [73.9116, 15.5009], tips: "Dress modestly inside the basilica." },
        { name: "Palolem Cove", category: "Nature", description: "Crescent palm-fringed beach ideal for kayaking and calm swims.", durationMins: 150, bestTimeOfDay: "afternoon", coordinates: [74.0232, 15.0100], tips: "Rent a sea kayak near the south rock point." },
        { name: "Anjuna Flea & Night Bazaar", category: "Shopping", description: "Artisan market with spice stalls, live music, and local snacks.", durationMins: 90, bestTimeOfDay: "evening", coordinates: [73.7408, 15.5736], tips: "Carry small change for local crafts." }
    ],
    jaipur: [
        { name: "Amber Fort & Maota Lake", category: "Heritage", description: "Hilltop Rajput palace complex featuring Sheesh Mahal mirror work.", durationMins: 150, bestTimeOfDay: "morning", coordinates: [75.8513, 26.9855], tips: "Start right at opening hour for cool courtyards." },
        { name: "Hawa Mahal", category: "Photography", description: "Iconic five-story sandstone facade with 953 jharokha lattice windows.", durationMins: 60, bestTimeOfDay: "morning", coordinates: [75.8267, 26.9239], tips: "Morning sun lights up the pink sandstone facade." },
        { name: "City Palace & Jantar Mantar", category: "Culture", description: "Royal courtyards and astronomical instruments in the Walled City.", durationMins: 120, bestTimeOfDay: "afternoon", coordinates: [75.8236, 26.9258], tips: "Both landmarks sit adjacent to each other." },
        { name: "Johari & Bapu Bazaar", category: "Shopping", description: "Vibrant markets for block-print textiles, mojaris, and gem crafts.", durationMins: 90, bestTimeOfDay: "afternoon", coordinates: [75.8260, 26.9182], tips: "Sample kachori and lassi at nearby heritage sweet shops." },
        { name: "Nahargarh Fort Sunset Terrace", category: "Nature", description: "Aravalli ridge fort overlooking the entire Pink City skyline.", durationMins: 90, bestTimeOfDay: "evening", coordinates: [75.8155, 26.9373], tips: "Stay for dusk as city lights flicker on." },
        { name: "Patrika Gate", category: "Photography", description: "Hand-painted arched pavilion celebrating Rajasthani motifs.", durationMins: 60, bestTimeOfDay: "morning", coordinates: [75.8027, 26.8442], tips: "Quick photo stop near Jawahar Circle." }
    ]
};

const MODE_SPEED_KMH = {
    driving: 28,
    transit: 18,
    walking: 4.5
};

function haversineKm(coordA, coordB) {
    if (!Array.isArray(coordA) || !Array.isArray(coordB) || coordA.length < 2 || coordB.length < 2) {
        return 3.5;
    }
    const toRad = (deg) => (deg * Math.PI) / 180;
    const [lon1, lat1] = coordA;
    const [lon2, lat2] = coordB;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const km = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(km * 10) / 10;
}

function estimateTravelMins(distanceKm, travelMode = "driving") {
    if (!distanceKm || distanceKm <= 0) return 5;
    const speed = MODE_SPEED_KMH[travelMode] || MODE_SPEED_KMH.driving;
    return Math.max(5, Math.round((distanceKm / speed) * 60));
}

function formatTimeFromMins(totalMins) {
    const wrapped = ((totalMins % (24 * 60)) + 24 * 60) % (24 * 60);
    const hh = String(Math.floor(wrapped / 60)).padStart(2, "0");
    const mm = String(wrapped % 60).padStart(2, "0");
    return `${hh}:${mm}`;
}

function parseStartTimeMins(timeStr = "09:00") {
    const match = /^(\d{2}):(\d{2})$/.exec(timeStr);
    if (!match) return 9 * 60;
    return Number(match[1]) * 60 + Number(match[2]);
}

async function resolveStopCoordinates(name, destination, anchorCoords) {
    if (process.env.NODE_ENV === "test" || !process.env.MAP_TOKEN) {
        return null;
    }
    try {
        const geocodingClient = mbxGeocoding({ accessToken: process.env.MAP_TOKEN });
        const resp = await geocodingClient.forwardGeocode({
            query: `${name}, ${destination}`,
            limit: 1,
            proximity: Array.isArray(anchorCoords) && anchorCoords.length === 2 ? anchorCoords : undefined
        }).send();
        const feat = resp.body && resp.body.features && resp.body.features[0];
        if (feat && feat.geometry && Array.isArray(feat.geometry.coordinates)) {
            return feat.geometry.coordinates;
        }
    } catch (err) {
        logger.warn(`Geocoding fallback for "${name}": ${err.message}`);
    }
    return null;
}

async function getLegMetrics(fromCoords, toCoords, travelMode) {
    const fallbackKm = Math.max(0.8, haversineKm(fromCoords, toCoords));
    const fallbackMins = estimateTravelMins(fallbackKm, travelMode);

    if (process.env.NODE_ENV === "test" || !process.env.MAP_TOKEN || typeof fetch !== "function") {
        return { distanceKm: fallbackKm, travelMins: fallbackMins };
    }

    const profile = travelMode === "walking" ? "walking" : "driving";
    try {
        const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${fromCoords[0]},${fromCoords[1]};${toCoords[0]},${toCoords[1]}?overview=false&access_token=${encodeURIComponent(process.env.MAP_TOKEN)}`;
        const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
        if (!response.ok) return { distanceKm: fallbackKm, travelMins: fallbackMins };
        const data = await response.json();
        const route = data.routes && data.routes[0];
        if (!route) return { distanceKm: fallbackKm, travelMins: fallbackMins };
        return {
            distanceKm: Math.round((route.distance / 1000) * 10) / 10,
            travelMins: Math.max(5, Math.round(route.duration / 60))
        };
    } catch (err) {
        return { distanceKm: fallbackKm, travelMins: fallbackMins };
    }
}

function buildGenericCandidates(destination, count, interests, startCoords) {
    const categories = interests && interests.length > 0
        ? interests
        : ["Heritage", "Nature", "Food", "Culture", "Shopping", "Photography"];
    const baseName = destination.split(",")[0].trim() || "Destination";
    const [baseLng, baseLat] = Array.isArray(startCoords) && startCoords.length === 2
        ? startCoords
        : DEFAULT_COORDINATES;

    const templates = [
        { suffix: "Old Town & Heritage Quarter", category: "Heritage", time: "morning", mins: 90, dLng: 0.014, dLat: 0.011 },
        { suffix: "Botanical Viewpoint & Nature Park", category: "Nature", time: "morning", mins: 105, dLng: -0.022, dLat: 0.018 },
        { suffix: "Local Culinary Street & Artisanal Market", category: "Food", time: "afternoon", mins: 90, dLng: 0.009, dLat: -0.013 },
        { suffix: "Cultural Museum & Craft Gallery", category: "Culture", time: "afternoon", mins: 90, dLng: -0.015, dLat: -0.008 },
        { suffix: "Sunset Promenade & Scenic Overlook", category: "Photography", time: "evening", mins: 75, dLng: 0.025, dLat: -0.019 },
        { suffix: "Adventure Trail & Lakeside Walk", category: "Adventure", time: "morning", mins: 120, dLng: -0.028, dLat: 0.024 },
        { suffix: "Night Bazaar & Souvenir Lane", category: "Shopping", time: "evening", mins: 75, dLng: 0.012, dLat: 0.006 }
    ];

    const list = [];
    for (let i = 0; i < count; i++) {
        const tpl = templates[i % templates.length];
        const cycle = Math.floor(i / templates.length);
        const cat = categories[i % categories.length] || tpl.category;
        list.push({
            name: `${baseName} ${tpl.suffix}${cycle > 0 ? ` (${cycle + 1})` : ""}`,
            category: cat,
            description: `Curated ${cat.toLowerCase()} experience around ${baseName}, balanced for local exploration.`,
            durationMins: tpl.mins,
            bestTimeOfDay: tpl.time,
            coordinates: [
                Number((baseLng + tpl.dLng * (cycle + 1)).toFixed(4)),
                Number((baseLat + tpl.dLat * (cycle + 1)).toFixed(4))
            ],
            tips: `Allow buffer time for local ${cat.toLowerCase()} highlights.`
        });
    }
    return list;
}

function getCuratedFallbackAttractions({ destination, days, pace, interests, startCoords }) {
    const stopsPerDay = pace === "relaxed" ? 3 : pace === "packed" ? 5 : 4;
    const needed = Math.min(25, days * stopsPerDay);
    const normalizedDest = (destination || "").toLowerCase();

    const matchedKey = Object.keys(DESTINATION_CATALOG).find((key) => normalizedDest.includes(key));
    let pool = matchedKey ? [...DESTINATION_CATALOG[matchedKey]] : [];

    // Prioritize stops matching user interests first
    if (pool.length > 0 && Array.isArray(interests) && interests.length > 0) {
        const interestSet = new Set(interests.map((s) => s.toLowerCase()));
        pool.sort((a, b) => {
            const aMatch = interestSet.has((a.category || "").toLowerCase()) ? 1 : 0;
            const bMatch = interestSet.has((b.category || "").toLowerCase()) ? 1 : 0;
            return bMatch - aMatch;
        });
    }

    if (pool.length < needed) {
        const extra = buildGenericCandidates(destination, needed - pool.length, interests, startCoords);
        pool = pool.concat(extra);
    }

    return pool.slice(0, needed);
}

async function fetchGeminiAttractions({ destination, days, pace, interests, dailyHours }) {
    const stopsPerDay = pace === "relaxed" ? 3 : pace === "packed" ? 5 : 4;
    const totalStops = Math.min(24, days * stopsPerDay);
    const interestList = (interests && interests.length > 0) ? interests.join(", ") : "Sightseeing, Culture, Food, Nature";

    const prompt = `Create a JSON array of ${totalStops} real, distinct tourist attractions in "${destination}" for a ${days}-day trip (${dailyHours} hours/day, "${pace}" pace) matching interests: ${interestList}.
Return ONLY a valid JSON array where each object has:
{
  "name": "string",
  "category": "string",
  "description": "1 concise sentence",
  "durationMins": integer between 45 and 180,
  "bestTimeOfDay": "morning" | "afternoon" | "evening",
  "lng": number (approximate longitude),
  "lat": number (approximate latitude),
  "tips": "short practical tip"
}`;

    const parsed = await callGeminiJson({
        prompt,
        temperature: 0.4,
        timeoutMs: 9000,
        label: `itinerary "${destination}"`
    });
    if (!Array.isArray(parsed) || parsed.length === 0) {
        return null;
    }

    return parsed
        .filter((item) => item && typeof item.name === "string" && item.name.trim())
        .map((item) => ({
            name: item.name.trim().slice(0, 120),
            category: typeof item.category === "string" ? item.category.trim().slice(0, 40) : "Sightseeing",
            description: typeof item.description === "string" ? item.description.trim().slice(0, 260) : "",
            durationMins: Math.min(240, Math.max(30, Number(item.durationMins) || 90)),
            bestTimeOfDay: ["morning", "afternoon", "evening"].includes(item.bestTimeOfDay) ? item.bestTimeOfDay : "any",
            coordinates: (Number.isFinite(Number(item.lng)) && Number.isFinite(Number(item.lat)))
                ? [Number(item.lng), Number(item.lat)]
                : null,
            tips: typeof item.tips === "string" ? item.tips.trim().slice(0, 200) : ""
        }));
}

async function generatePersonalizedItinerary({
    destination,
    days,
    dailyHours = 8,
    dailyStartTime = "09:00",
    pace = "balanced",
    travelMode = "driving",
    interests = [],
    startCoordinates = DEFAULT_COORDINATES
}) {
    const anchor = Array.isArray(startCoordinates) && startCoordinates.length === 2
        ? startCoordinates
        : DEFAULT_COORDINATES;

    let sourceProvider = "gemini";
    let candidates = await fetchGeminiAttractions({ destination, days, pace, interests, dailyHours });
    if (!candidates || candidates.length === 0) {
        sourceProvider = "curated_fallback";
        candidates = getCuratedFallbackAttractions({ destination, days, pace, interests, startCoords: anchor });
    }

    // Resolve any missing coordinates sequentially (bounded list)
    for (let i = 0; i < candidates.length; i++) {
        if (!candidates[i].coordinates) {
            const geocoded = await resolveStopCoordinates(candidates[i].name, destination, anchor);
            candidates[i].coordinates = geocoded || [
                Number((anchor[0] + ((i % 5) - 2) * 0.012).toFixed(4)),
                Number((anchor[1] + ((i % 4) - 1.5) * 0.012).toFixed(4))
            ];
        }
    }

    // Nearest-neighbor ordering + day-budget packing
    const remaining = [...candidates];
    const maxStopsPerDay = pace === "relaxed" ? 3 : pace === "packed" ? 5 : 4;
    const budgetMins = Number(dailyHours) * 60;
    const dayStartMins = parseStartTimeMins(dailyStartTime);
    const dayThemes = ["Arrival & Iconic Highlights", "Nature & Local Flavors", "Culture, Trails & Markets", "Hidden Gems & Scenic Views"];

    const dayPlans = [];
    let totalDistanceKm = 0;
    let totalTravelMins = 0;

    for (let dayNum = 1; dayNum <= days; dayNum++) {
        let currentCoords = anchor;
        let usedMins = 0;
        let dayDist = 0;
        let dayTravel = 0;
        const stops = [];

        while (remaining.length > 0 && stops.length < maxStopsPerDay) {
            // Pick closest remaining attraction from current position
            let bestIdx = 0;
            let bestDist = Infinity;
            for (let idx = 0; idx < remaining.length; idx++) {
                const dist = haversineKm(currentCoords, remaining[idx].coordinates);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestIdx = idx;
                }
            }

            const chosen = remaining[bestIdx];
            const leg = await getLegMetrics(currentCoords, chosen.coordinates, travelMode);
            const visitMins = chosen.durationMins || 90;

            if (stops.length > 0 && usedMins + leg.travelMins + visitMins > budgetMins) {
                break;
            }

            remaining.splice(bestIdx, 1);
            const arrivalMins = dayStartMins + usedMins + leg.travelMins;
            usedMins += leg.travelMins + visitMins;
            dayDist = Math.round((dayDist + leg.distanceKm) * 10) / 10;
            dayTravel += leg.travelMins;
            currentCoords = chosen.coordinates;

            stops.push({
                order: stops.length + 1,
                name: chosen.name,
                category: chosen.category,
                description: chosen.description,
                coordinates: chosen.coordinates,
                bestTimeOfDay: chosen.bestTimeOfDay || "any",
                arrivalTime: formatTimeFromMins(arrivalMins),
                durationMins: visitMins,
                distanceFromPrevKm: leg.distanceKm,
                travelMinsFromPrev: leg.travelMins,
                tips: chosen.tips || ""
            });
        }

        totalDistanceKm = Math.round((totalDistanceKm + dayDist) * 10) / 10;
        totalTravelMins += dayTravel;

        dayPlans.push({
            dayNumber: dayNum,
            theme: dayThemes[(dayNum - 1) % dayThemes.length],
            estimatedDistanceKm: dayDist,
            estimatedTravelMins: dayTravel,
            stops
        });
    }

    return {
        destination,
        startCoordinates: anchor,
        days,
        dailyStartTime,
        dailyHours,
        pace,
        travelMode,
        interests,
        sourceProvider,
        totalDistanceKm,
        totalTravelMins,
        dayPlans
    };
}

module.exports = {
    generatePersonalizedItinerary,
    haversineKm,
    estimateTravelMins,
    DESTINATION_CATALOG
};
