const MS_PER_DAY = 1000 * 60 * 60 * 24;

function computeDateOverlapDays(poolCheckIn, poolCheckOut, searchCheckIn, searchCheckOut) {
    const pStart = new Date(poolCheckIn).getTime();
    const pEnd = new Date(poolCheckOut).getTime();
    if (!searchCheckIn || !searchCheckOut) {
        return { ratio: 1, overlapDays: Math.max(1, Math.round((pEnd - pStart) / MS_PER_DAY)) };
    }
    const sStart = new Date(searchCheckIn).getTime();
    const sEnd = new Date(searchCheckOut).getTime();
    const overlapMs = Math.min(pEnd, sEnd) - Math.max(pStart, sStart);
    if (overlapMs <= 0) {
        return { ratio: 0, overlapDays: 0 };
    }
    const requestedMs = Math.max(MS_PER_DAY, sEnd - sStart);
    return {
        ratio: Math.min(1, overlapMs / requestedMs),
        overlapDays: Math.max(1, Math.round(overlapMs / MS_PER_DAY))
    };
}

function areGendersCompatible(candidateUser, initiatorUser, poolPrefGender) {
    const candPref = candidateUser?.travelProfile?.preferredCompanionGender || "any";
    const poolRequiresSame = poolPrefGender === "same_gender" || initiatorUser?.travelProfile?.preferredCompanionGender === "same_gender";
    const candRequiresSame = candPref === "same_gender";

    if (!poolRequiresSame && !candRequiresSame) return true;

    const candGender = candidateUser?.travelProfile?.gender || "prefer_not_to_say";
    const initGender = initiatorUser?.travelProfile?.gender || "prefer_not_to_say";
    if (candGender === "prefer_not_to_say" || initGender === "prefer_not_to_say") {
        return false;
    }
    return candGender === initGender;
}

function isSmokingCompatible(candidateUser, poolPrefSmoking) {
    const candSmoking = candidateUser?.travelProfile?.smokingPreference || "no_preference";
    if (poolPrefSmoking === "non_smoker" && candSmoking === "smoker") return false;
    if (candSmoking === "non_smoker" && poolPrefSmoking === "smoker") return false;
    return true;
}

/**
 * Score how compatible a solo traveler (or guest search filter) is with an open RoomSharePool.
 * Returns { compatible, score (0-100), reasons, overlapDays }.
 */
function scorePoolCompatibility(candidateUser, pool, searchCriteria = {}) {
    const reasons = [];
    const initiator = pool.initiator || {};

    if (!areGendersCompatible(candidateUser, initiator, pool.preferences?.companionGender)) {
        return { compatible: false, score: 0, reasons: ["Companion gender preference mismatch"], overlapDays: 0 };
    }

    if (!isSmokingCompatible(candidateUser, pool.preferences?.smokingPreference)) {
        return { compatible: false, score: 0, reasons: ["Smoking preference mismatch"], overlapDays: 0 };
    }

    let score = 0;

    // 1. Date overlap (30 pts)
    const { ratio, overlapDays } = computeDateOverlapDays(
        pool.checkIn,
        pool.checkOut,
        searchCriteria.checkIn,
        searchCriteria.checkOut
    );
    if (searchCriteria.checkIn && searchCriteria.checkOut && ratio === 0) {
        return { compatible: false, score: 0, reasons: ["Dates do not overlap"], overlapDays: 0 };
    }
    const datePts = Math.round(30 * ratio);
    score += datePts;
    if (searchCriteria.checkIn && searchCriteria.checkOut && ratio >= 0.8) {
        reasons.push(`${Math.round(ratio * 100)}% date match`);
    } else {
        reasons.push(`${overlapDays}-night shared stay`);
    }

    // 2. Budget fit (20 pts)
    const maxBudget = Number(searchCriteria.maxBudget || 0);
    if (maxBudget > 0) {
        if (pool.pricePerPerson <= maxBudget) {
            score += 20;
            reasons.push("Within budget");
        } else if (pool.pricePerPerson <= maxBudget * 1.15) {
            score += 10;
        }
    } else {
        score += 20;
    }

    // 3. Shared interests & travel style (25 pts)
    const candInterests = new Set((candidateUser?.travelProfile?.interests || []).map((s) => s.toLowerCase()));
    const initInterests = (initiator?.travelProfile?.interests || []).map((s) => s.toLowerCase());
    const sharedInterests = initInterests.filter((i) => candInterests.has(i));
    if (sharedInterests.length > 0) {
        score += Math.min(18, sharedInterests.length * 6);
        reasons.push(`Shared interests: ${sharedInterests.slice(0, 2).join(", ")}`);
    } else if (candInterests.size === 0 || initInterests.length === 0) {
        score += 10;
    }

    const candStyle = candidateUser?.travelProfile?.travelStyle || "balanced";
    const initStyle = initiator?.travelProfile?.travelStyle || "balanced";
    if (candStyle === initStyle) {
        score += 7;
    } else {
        score += 3;
    }

    // 4. Sleep schedule & languages (15 pts)
    const candSleep = candidateUser?.travelProfile?.sleepSchedule || "flexible";
    const poolSleep = pool.preferences?.sleepSchedule || initiator?.travelProfile?.sleepSchedule || "flexible";
    if (candSleep === poolSleep || candSleep === "flexible" || poolSleep === "flexible") {
        score += 10;
        if (candSleep === poolSleep && candSleep !== "flexible") {
            reasons.push(candSleep === "early_bird" ? "Both early risers" : "Both night owls");
        }
    }

    const candLangs = new Set((candidateUser?.travelProfile?.languages || ["English"]).map((l) => l.toLowerCase()));
    const initLangs = (initiator?.travelProfile?.languages || ["English"]).map((l) => l.toLowerCase());
    if (initLangs.some((l) => candLangs.has(l))) {
        score += 5;
    }

    // 5. Verified identity bonus (10 pts)
    if (initiator?.emailVerified) {
        score += 5;
        reasons.push("Verified host-pool initiator");
    }
    if (!candidateUser || candidateUser.emailVerified) {
        score += 5;
    }

    return {
        compatible: true,
        score: Math.min(100, Math.max(0, score)),
        reasons,
        overlapDays
    };
}

module.exports = {
    scorePoolCompatibility,
    computeDateOverlapDays
};
