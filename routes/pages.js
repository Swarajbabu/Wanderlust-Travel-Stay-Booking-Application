const express = require("express");
const router = express.Router();

const PAGES = {
    help: {
        title: "Help Centre",
        icon: "fa-circle-question",
        subtitle: "Frequently asked questions for Wanderlust guests and hosts.",
        sections: [
            {
                heading: "Booking & Availability",
                body: "Select your check-in and check-out dates on any listing's booking page. Confirmed stays and active checkouts automatically lock dates to prevent double-bookings."
            },
            {
                heading: "Hosting Your Home",
                body: "Verify your email address via OTP or Google Sign-In, then click 'Wanderlust your home' to publish a listing with photos, pricing, capacity, and amenities. Manage all incoming reservations from your Host Dashboard."
            },
            {
                heading: "Need Support?",
                body: "Reach out to our support team anytime or manage your bookings directly from the My Bookings page."
            }
        ]
    },
    "cancellation-policy": {
        title: "Cancellation & Refund Policy",
        icon: "fa-rotate-left",
        subtitle: "Transparent, guest-friendly cancellations before check-in.",
        sections: [
            {
                heading: "Free Cancellation Before Check-In",
                body: "Guests may cancel any pending or confirmed reservation prior to the scheduled check-in date directly from My Bookings."
            },
            {
                heading: "Automated Razorpay Refunds",
                body: "When a paid booking is cancelled before check-in (or cancelled by the host), a full refund is automatically initiated to your original payment method and tracked with a Refund ID."
            },
            {
                heading: "Modifying Dates",
                body: "Unpaid pending bookings can have their dates adjusted from My Bookings before payment confirmation, subject to calendar availability."
            }
        ]
    },
    privacy: {
        title: "Privacy Policy",
        icon: "fa-user-shield",
        subtitle: "How Wanderlust protects your account, booking, and payment data.",
        sections: [
            {
                heading: "Data We Collect",
                body: "We store only the information required to operate your account, bookings, and reviews — including your username, verified email address, and optional profile details."
            },
            {
                heading: "Payment Security",
                body: "All online payments are processed through Razorpay over encrypted HTTPS. Wanderlust never stores raw card or UPI credentials on its servers."
            },
            {
                heading: "Session & Cookie Protection",
                body: "Sessions are stored securely in MongoDB with HTTP-only cookies, CSRF double-submit tokens, and rate-limited authentication endpoints."
            }
        ]
    },
    terms: {
        title: "Terms of Service",
        icon: "fa-file-contract",
        subtitle: "Guidelines for using the Wanderlust platform responsibly.",
        sections: [
            {
                heading: "Platform Usage",
                body: "By creating an account or booking a stay on Wanderlust, you agree to provide accurate listing details, respect host house rules, and submit honest reviews based on completed stays."
            },
            {
                heading: "Pricing & Taxes",
                body: "Nightly stay prices are computed server-side with applicable 18% GST clearly itemized prior to checkout and on your booking receipt."
            },
            {
                heading: "Host Responsibilities",
                body: "Hosts are responsible for keeping property availability, capacity limits, and amenities accurate for guests."
            }
        ]
    }
};

Object.entries(PAGES).forEach(([slug, page]) => {
    router.get(`/${slug}`, (req, res) => {
        res.render("pages/info.ejs", { page, title: page.title });
    });
});

module.exports = router;
