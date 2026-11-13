const Listing = require("../modals/listing");
const Booking = require("../modals/booking");
const RoomSharePool = require("../modals/roomShare");
const ExpressError = require("../utility/ExpressError");
const crypto = require("crypto");
const emailTransporter = require("../config/email");
const logger = require("../config/logger");
const {
    PENDING_BOOKING_TTL_MS,
    getRazorpayInstance,
    activeBookingFilter,
    calculateBookingPricing
} = require("../utility/bookingHelpers");

const razorpayInstance = getRazorpayInstance();

async function sendBookingConfirmationEmail(bookingId) {
    try {
        const booking = await Booking.findById(bookingId).populate("listing").populate("guest");
        if (!booking || !booking.guest || !booking.guest.email) return;

        const mailOptions = {
            from: process.env.SMTP_FROM || "Wanderlust <no-reply@wanderlust.com>",
            to: booking.guest.email,
            subject: "Booking Confirmed! - Wanderlust",
            text: `Hello ${booking.guest.username},\n\nYour booking for "${booking.listing.title}" is confirmed!\n\nDetails:\nCheck-In: ${new Date(booking.checkIn).toLocaleDateString("en-IN")}\nCheck-Out: ${new Date(booking.checkOut).toLocaleDateString("en-IN")}\nTotal Price: Rs. ${booking.totalPrice.toLocaleString("en-IN")}\nStatus: Confirmed\n\nThank you for choosing Wanderlust!\n\nBest regards,\nThe Wanderlust Team`,
        };

        await emailTransporter.sendMail(mailOptions);
        logger.info(`Booking confirmation email sent to guest ${booking.guest.email} for booking ${bookingId}`);
    } catch (err) {
        logger.error(`Failed to send booking confirmation email for booking ${bookingId}: ${err.message}`);
    }
}

async function sendBookingCancellationEmail(bookingId, cancellationReason, refundInfo) {
    try {
        const booking = await Booking.findById(bookingId).populate("listing").populate("guest");
        if (!booking || !booking.guest || !booking.guest.email) return;

        let refundText = "";
        if (refundInfo && refundInfo.id) {
            refundText = `\n\nRefund Details:\nA full refund of Rs. ${Number(refundInfo.amount).toLocaleString("en-IN")} has been credited to your payment account.\nRefund ID: ${refundInfo.id}\nStatus: ${refundInfo.status}`;
        }

        const mailOptions = {
            from: process.env.SMTP_FROM || "Wanderlust <no-reply@wanderlust.com>",
            to: booking.guest.email,
            subject: "Booking Cancelled - Wanderlust",
            text: `Hello ${booking.guest.username},\n\nYour booking for "${booking.listing.title}" has been cancelled.\n\nCancellation Reason: ${cancellationReason}${refundText}\n\nDetails:\nCheck-In: ${new Date(booking.checkIn).toLocaleDateString("en-IN")}\nCheck-Out: ${new Date(booking.checkOut).toLocaleDateString("en-IN")}\n\nIf you have any questions, please contact support.\n\nBest regards,\nThe Wanderlust Team`,
        };

        await emailTransporter.sendMail(mailOptions);
        logger.info(`Booking cancellation email sent to guest ${booking.guest.email} for booking ${bookingId}`);
    } catch (err) {
        logger.error(`Failed to send booking cancellation email for booking ${bookingId}: ${err.message}`);
    }
}

// Shared pricing and active-hold filters live in ../utility/bookingHelpers.js.

module.exports.createBooking = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        throw new ExpressError(404, "Listing Not Found");
    }

    if (listing.owner && listing.owner.equals(req.user._id)) {
        req.flash("error", "You cannot book your own listing.");
        return res.redirect(`/listings/${id}`);
    }

    const { checkIn, checkOut, guests, specialRequests } = req.body.booking;
    const requestedGuests = guests ? Math.max(1, Number(guests)) : 1;
    const maxGuests = listing.maxGuests || 4;
    if (requestedGuests > maxGuests) {
        req.flash("error", `This property accommodates up to ${maxGuests} guest${maxGuests === 1 ? "" : "s"}.`);
        return res.redirect(`/listings/${id}/book`);
    }

    const requestedCheckIn = new Date(checkIn);
    const requestedCheckOut = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (requestedCheckIn < today) {
        req.flash("error", "Check-in date cannot be in the past.");
        return res.redirect(`/listings/${id}/book`);
    }

    const overlappingBooking = await Booking.findOne(activeBookingFilter({
        listing: id,
        checkIn: { $lt: requestedCheckOut },
        checkOut: { $gt: requestedCheckIn }
    }));

    if (overlappingBooking) {
        req.flash("error", "This listing is already booked for the selected dates.");
        return res.redirect(`/listings/${id}/book`);
    }

    const { basePrice, taxAmount, totalPrice } = calculateBookingPricing(requestedCheckIn, requestedCheckOut, listing.price);

    const newBooking = new Booking({
        listing: id,
        guest: req.user._id,
        checkIn: requestedCheckIn,
        checkOut: requestedCheckOut,
        guests: guests ? Math.max(1, Number(guests)) : 1,
        specialRequests: specialRequests ? String(specialRequests).trim() : "",
        basePrice,
        taxAmount,
        totalPrice,
        status: "pending",
        expiresAt: new Date(Date.now() + PENDING_BOOKING_TTL_MS)
    });

    await newBooking.save();
    req.flash("success", "Booking created successfully! Proceeding to payment...");
    res.redirect(`/bookings/${newBooking._id}/checkout`);
};

module.exports.getBookedDates = async (req, res) => {
    const { id } = req.params;
    const bookings = await Booking.find(activeBookingFilter({ listing: id })).select("checkIn checkOut");
    res.json(bookings);
};

// Render dedicated separate booking page with date-wise availability
module.exports.renderBookingPage = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id)
        .populate("owner")
        .populate({ path: "reviews", populate: { path: "author" } });
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    // Remember redirect url so user returns to this booking page if logging in
    if (!req.user) {
        req.session.redirectUrl = req.originalUrl;
    }

    const bookings = await Booking.find(activeBookingFilter({ listing: id }))
        .select("checkIn checkOut totalPrice status");

    // Compute actual review count and average rating directly from database
    let avgRating = "New";
    if (listing.reviews && listing.reviews.length > 0) {
        const sum = listing.reviews.reduce((acc, r) => acc + Number(r.rating || 5), 0);
        avgRating = (sum / listing.reviews.length).toFixed(1);
    }

    res.render("bookings/book.ejs", {
        listing,
        bookings,
        avgRating,
        title: `Book Stay · ${listing.title}`
    });
};

module.exports.myBookings = async (req, res) => {
    const [bookings, sharedPools] = await Promise.all([
        Booking.find({ guest: req.user._id })
            .populate({
                path: "listing",
                select: "title image price location country description category"
            })
            .sort({ createdAt: -1 }),
        RoomSharePool.find({
            participants: {
                $elemMatch: {
                    user: req.user._id,
                    joinStatus: "accepted"
                }
            },
            status: { $in: ["locked", "partially_booked", "confirmed", "cancelled"] }
        })
            .populate("listing", "title image price location country category")
            .populate("initiator", "username")
            .populate("participants.user", "username")
            .sort({ createdAt: -1 })
    ]);
    res.render("bookings/index.ejs", { bookings, sharedPools, title: "My Bookings" });
};

// Edit / Modify existing booking dates (unpaid pending bookings only)
module.exports.editBookingDates = async (req, res) => {
    const { bookingId } = req.params;
    const { checkIn, checkOut } = req.body.booking;
    const booking = await Booking.findById(bookingId).populate("listing");
    if (!booking) {
        throw new ExpressError(404, "Booking Not Found");
    }

    if (booking.status !== "pending" || booking.paymentId) {
        req.flash("error", "Confirmed or paid bookings cannot have dates modified directly. Please cancel and create a new booking.");
        return res.redirect("/bookings");
    }

    const requestedCheckIn = new Date(checkIn);
    const requestedCheckOut = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (requestedCheckIn < today) {
        req.flash("error", "Check-in date cannot be in the past.");
        return res.redirect("/bookings");
    }

    if (requestedCheckOut <= requestedCheckIn) {
        req.flash("error", "Check-out date must be after check-in date.");
        return res.redirect("/bookings");
    }

    // Check overlap with other bookings for this listing
    const overlapping = await Booking.findOne(activeBookingFilter({
        _id: { $ne: bookingId },
        listing: booking.listing._id,
        checkIn: { $lt: requestedCheckOut },
        checkOut: { $gt: requestedCheckIn }
    }));

    if (overlapping) {
        req.flash("error", "This stay is already booked for these new dates. Please pick different dates.");
        return res.redirect("/bookings");
    }

    const { basePrice, taxAmount, totalPrice } = calculateBookingPricing(
        requestedCheckIn,
        requestedCheckOut,
        booking.listing.price || 1000
    );

    booking.checkIn = requestedCheckIn;
    booking.checkOut = requestedCheckOut;
    if (req.body.booking.guests) {
        const requestedGuests = Math.max(1, Number(req.body.booking.guests));
        const maxGuests = (booking.listing && booking.listing.maxGuests) || 4;
        if (requestedGuests > maxGuests) {
            req.flash("error", `This property accommodates up to ${maxGuests} guest${maxGuests === 1 ? "" : "s"}.`);
            return res.redirect("/bookings");
        }
        booking.guests = requestedGuests;
    }
    booking.basePrice = basePrice;
    booking.taxAmount = taxAmount;
    booking.totalPrice = totalPrice;
    booking.expiresAt = new Date(Date.now() + PENDING_BOOKING_TTL_MS);

    await booking.save();
    req.flash("success", `Booking dates updated to ${requestedCheckIn.toLocaleDateString("en-IN")} - ${requestedCheckOut.toLocaleDateString("en-IN")} (Total: ₹${totalPrice.toLocaleString("en-IN")})!`);
    res.redirect("/bookings");
};

module.exports.cancelBooking = async (req, res) => {
    let { bookingId } = req.params;
    let { cancellationReason } = req.body;
    const booking = await Booking.findById(bookingId).populate("listing").populate("guest");
    if (!booking) {
        throw new ExpressError(404, "Booking Not Found");
    }

    const isGuest = Boolean(booking.guest && req.user && (booking.guest._id || booking.guest).equals(req.user._id));
    const isOwner = Boolean(booking.listing && booking.listing.owner && req.user && booking.listing.owner.equals(req.user._id));

    if (isGuest && booking.checkIn <= new Date()) {
        req.flash("error", "You cannot cancel a booking on or after the check-in date.");
        return res.redirect("/bookings");
    }

    booking.status = "cancelled";
    booking.cancellationReason = cancellationReason;
    booking.cancelledBy = req.user._id;
    booking.cancelledAt = new Date();

    let refundInfo = null;

    // If booking was paid via Razorpay, initiate refund to original payment account
    if (booking.paymentId) {
        try {
            const refund = await razorpayInstance.payments.refund(booking.paymentId, {
                amount: Math.round(booking.totalPrice * 100), // amount in paisa
                notes: {
                    reason: cancellationReason,
                    bookingId: booking._id.toString()
                }
            });
            booking.refundId = refund.id;
            booking.refundStatus = refund.status || "processed";
            booking.refundAmount = booking.totalPrice;
            refundInfo = { id: refund.id, amount: booking.totalPrice, status: booking.refundStatus };
            logger.info(`Refund initiated for booking ${booking._id}: Refund ID ${refund.id}, Amount: Rs. ${booking.totalPrice}`);
            req.flash("success", `Booking cancelled successfully! A refund of ₹${booking.totalPrice.toLocaleString("en-IN")} has been credited to your payment account (Refund ID: ${refund.id}).`);
        } catch (err) {
            logger.error(`Razorpay refund failed for booking ${booking._id}: ${err.message}`);
            booking.refundStatus = "failed";
            req.flash("error", `Booking cancelled, but automatic refund encountered an issue: ${err.message}. Please contact support.`);
        }
    } else {
        booking.refundStatus = "not_applicable";
        req.flash("success", "Booking cancelled successfully!");
    }

    await booking.save();

    // Send cancellation email (async)
    sendBookingCancellationEmail(booking._id, cancellationReason, refundInfo).catch(err => logger.error(err));

    if (isGuest) {
        res.redirect("/bookings");
    } else {
        res.redirect(`/listings/${booking.listing._id}`);
    }
};

module.exports.confirmBooking = async (req, res) => {
    let { bookingId } = req.params;
    const booking = await Booking.findById(bookingId).populate("listing");
    if (!booking) {
        throw new ExpressError(404, "Booking Not Found");
    }

    booking.status = "confirmed";
    booking.expiresAt = null;
    await booking.save();
    
    // Send confirmation email (async)
    sendBookingConfirmationEmail(booking._id).catch(err => logger.error(err));

    req.flash("success", "Booking confirmed successfully!");
    res.redirect(`/listings/${booking.listing._id}`);
};

module.exports.renderCheckout = async (req, res) => {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId).populate("listing").populate("guest");
    if (!booking) {
        throw new ExpressError(404, "Booking Not Found");
    }

    if (booking.status !== "pending") {
        req.flash("error", `This booking is already ${booking.status}.`);
        return res.redirect("/bookings");
    }

    if (!booking.listing) {
        req.flash("error", "The listing for this booking is no longer available.");
        return res.redirect("/bookings");
    }

    // Create Razorpay order and bind its ID to this booking to prevent cross-booking replay
    const options = {
        amount: Math.round(booking.totalPrice * 100), // amount in paisa
        currency: "INR",
        receipt: booking._id.toString()
    };

    try {
        const order = await razorpayInstance.orders.create(options);
        booking.razorpayOrderId = order.id;
        await booking.save();

        res.render("bookings/checkout.ejs", {
            booking,
            order,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
            title: "Checkout & Payment"
        });
    } catch (err) {
        throw new ExpressError(500, `Razorpay Order Creation Failed: ${err.message}`);
    }
};

// Lets the demo "guest_user" evaluation account skip Razorpay entirely and
// confirm a pending booking directly, so reviewers aren't forced through a
// live payment gateway to see the full booking flow.
module.exports.guestQuickConfirm = async (req, res) => {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId).populate("listing");
    if (!booking) {
        throw new ExpressError(404, "Booking Not Found");
    }

    if (booking.status !== "pending") {
        req.flash("error", `This booking is already ${booking.status}.`);
        return res.redirect("/bookings");
    }

    booking.status = "confirmed";
    booking.expiresAt = null;
    await booking.save();

    // Send confirmation email (async)
    sendBookingConfirmationEmail(booking._id).catch(err => logger.error(err));

    req.flash("success", "Booking confirmed! (Payment skipped for the guest evaluation account.)");
    res.redirect("/bookings");
};

module.exports.verifyPayment = async (req, res) => {
    const { bookingId } = req.params;
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
        throw new ExpressError(404, "Booking Not Found");
    }

    if (booking.status !== "pending") {
        req.flash("error", `This booking is already ${booking.status}.`);
        return res.redirect("/bookings");
    }

    if (booking.razorpayOrderId && booking.razorpayOrderId !== razorpay_order_id) {
        throw new ExpressError(400, "Order ID mismatch during payment verification.");
    }

    // Verify signature
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest("hex");

    if (generated_signature === razorpay_signature) {
        booking.status = "confirmed";
        booking.paymentId = razorpay_payment_id;
        booking.razorpayOrderId = razorpay_order_id;
        booking.expiresAt = null;
        await booking.save();

        // Send confirmation email (async)
        sendBookingConfirmationEmail(booking._id).catch(err => logger.error(err));

        req.flash("success", "Payment successful! Your booking has been confirmed.");
        res.redirect("/bookings");
    } else {
        throw new ExpressError(400, "Payment signature verification failed.");
    }
};

// Clear all demo bookings for the guest evaluation account
module.exports.clearGuestBookings = async (req, res) => {
    if (req.user && req.user.username === "guest_user") {
        const result = await Booking.deleteMany({ guest: req.user._id });
        logger.info(`Cleared ${result.deletedCount} demo bookings for guest_user`);
        req.flash("success", "All demo bookings have been cleared.");
    }
    res.redirect("/bookings");
};

module.exports.renderReceipt = async (req, res) => {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId)
        .populate({
            path: "listing",
            populate: { path: "owner", select: "username" }
        })
        .populate("guest", "username email");
    if (!booking) {
        throw new ExpressError(404, "Booking Not Found");
    }
    res.render("bookings/receipt.ejs", {
        booking,
        title: `Booking Receipt · ${booking._id.toString().slice(-6).toUpperCase()}`
    });
};

module.exports.razorpayWebhook = async (req, res) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
        return res.status(503).json({ error: "Razorpay webhook secret not configured" });
    }

    const signature = req.headers["x-razorpay-signature"];
    const payload = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));
    const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(payload).digest("hex");

    if (!signature || signature !== expectedSignature) {
        logger.warn("Invalid Razorpay webhook signature received.");
        return res.status(400).json({ error: "Invalid webhook signature" });
    }

    const event = req.body?.event;
    if (event === "payment.captured" || event === "order.paid") {
        const paymentEntity = req.body?.payload?.payment?.entity;
        const orderEntity = req.body?.payload?.order?.entity;
        const orderId = paymentEntity?.order_id || orderEntity?.id;
        const paymentId = paymentEntity?.id;

        if (orderId) {
            const booking = await Booking.findOne({ razorpayOrderId: orderId });
            if (booking && booking.status === "pending") {
                booking.status = "confirmed";
                if (paymentId) booking.paymentId = paymentId;
                booking.expiresAt = null;
                await booking.save();
                sendBookingConfirmationEmail(booking._id).catch((err) => logger.error(err));
                logger.info(`Webhook confirmed booking ${booking._id} for order ${orderId}`);
            }
        }
    }

    res.status(200).json({ status: "ok" });
};
