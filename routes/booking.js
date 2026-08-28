const express = require("express");
const router = express.Router({ mergeParams: true });

const wrapAsync = require("../utility/wrapAsync");
const { isLoggedIn, validateBooking, validateCancellation, isBookingOwner, isBookingGuest, isBookingGuestOrOwner } = require("../middleware.js");
const bookingController = require("../controllers/booking.js");

// POST route to create a booking
router.post("/listings/:id/bookings", isLoggedIn, validateBooking, wrapAsync(bookingController.createBooking));

// GET route to get booked dates
router.get("/listings/:id/bookings/booked-dates", wrapAsync(bookingController.getBookedDates));

// GET route to view current user's bookings
router.get("/bookings", isLoggedIn, wrapAsync(bookingController.myBookings));

// PATCH route to cancel a booking (can be cancelled by either guest or listing owner)
router.patch("/bookings/:bookingId/cancel", isLoggedIn, isBookingGuestOrOwner, validateCancellation, wrapAsync(bookingController.cancelBooking));

// PATCH route to confirm a booking (can only be confirmed by listing owner)
router.patch("/bookings/:bookingId/confirm", isLoggedIn, isBookingOwner, wrapAsync(bookingController.confirmBooking));

// GET route to render Razorpay checkout page
router.get("/bookings/:bookingId/checkout", isLoggedIn, isBookingGuest, wrapAsync(bookingController.renderCheckout));

// POST route to verify payment signature
router.post("/bookings/:bookingId/verify-payment", isLoggedIn, isBookingGuest, wrapAsync(bookingController.verifyPayment));

module.exports = router;
