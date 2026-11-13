const Razorpay = require("razorpay");

const PENDING_BOOKING_TTL_MS = 20 * 60 * 1000; // 20 minutes

function getRazorpayInstance() {
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
}

// Filter for bookings that currently hold calendar dates (confirmed or non-expired pending).
function activeBookingFilter(extra = {}) {
    const now = new Date();
    return {
        ...extra,
        $or: [
            { status: "confirmed" },
            { status: "pending", expiresAt: null },
            { status: "pending", expiresAt: { $gt: now } }
        ]
    };
}

// Compute base price, 18% GST, and total server-side so client values are never trusted.
function calculateBookingPricing(checkIn, checkOut, nightlyPrice) {
    const timeDiff = checkOut - checkIn;
    const nights = Math.max(1, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
    const basePrice = nights * Number(nightlyPrice || 0);
    const taxAmount = Math.round(basePrice * 0.18);
    const totalPrice = basePrice + taxAmount;
    return { nights, basePrice, taxAmount, totalPrice };
}

module.exports = {
    PENDING_BOOKING_TTL_MS,
    getRazorpayInstance,
    activeBookingFilter,
    calculateBookingPricing
};
