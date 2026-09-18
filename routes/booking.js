const express = require("express");
const router = express.Router({ mergeParams: true });

const wrapAsync = require("../utility/wrapAsync");
const { isLoggedIn, validateBooking, validateCancellation, isBookingOwner, isBookingGuest, isBookingGuestOrOwner, isGuestDemoUser } = require("../middleware.js");
const bookingController = require("../controllers/booking.js");

// GET route to render separate dedicated booking page with date-wise flight style availability
router.get("/listings/:id/book", wrapAsync(bookingController.renderBookingPage));

// POST route to create a booking
router.post("/listings/:id/bookings", isLoggedIn, validateBooking, wrapAsync(bookingController.createBooking));

// GET route to get booked dates
router.get("/listings/:id/bookings/booked-dates", wrapAsync(bookingController.getBookedDates));

// GET route to view current user's bookings
router.get("/bookings", isLoggedIn, wrapAsync(bookingController.myBookings));

// PATCH route to edit booking dates
router.patch("/bookings/:bookingId/edit-dates", isLoggedIn, isBookingGuestOrOwner, wrapAsync(bookingController.editBookingDates));

// PATCH route to cancel a booking (can be cancelled by either guest or listing owner)
router.patch("/bookings/:bookingId/cancel", isLoggedIn, isBookingGuestOrOwner, validateCancellation, wrapAsync(bookingController.cancelBooking));

// PATCH route to confirm a booking (can only be confirmed by listing owner)
router.patch("/bookings/:bookingId/confirm", isLoggedIn, isBookingOwner, wrapAsync(bookingController.confirmBooking));

// GET route to render Razorpay checkout page
router.get("/bookings/:bookingId/checkout", isLoggedIn, isBookingGuest, wrapAsync(bookingController.renderCheckout));

// PATCH route to let the demo guest evaluation account skip Razorpay and confirm the booking directly
router.patch("/bookings/:bookingId/guest-confirm", isLoggedIn, isBookingGuest, isGuestDemoUser, wrapAsync(bookingController.guestQuickConfirm));

// POST route to verify payment signature
router.post("/bookings/:bookingId/verify-payment", isLoggedIn, isBookingGuest, wrapAsync(bookingController.verifyPayment));

module.exports = router;
