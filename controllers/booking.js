const Listing = require("../modals/listing");
const Booking = require("../modals/booking");
const ExpressError = require("../utility/ExpressError");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const emailTransporter = require("../config/email");
const logger = require("../config/logger");

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

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

// 
module.exports.createBooking = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if (!listing) {
        throw new ExpressError(404, "Listing Not Found");
    }

    let { checkIn, checkOut } = req.body.booking;
    const requestedCheckIn = new Date(checkIn);
    const requestedCheckOut = new Date(checkOut);

    // Query overlappingConfirmed/pending Bookings for the listing
    const overlappingBooking = await Booking.findOne({
        listing: id,
        status: { $in: ["pending", "confirmed"] },
        checkIn: { $lt: requestedCheckOut },
        checkOut: { $gt: requestedCheckIn }
    });

    if (overlappingBooking) {
        req.flash("error", "This listing is already booked for the selected dates.");
        return res.redirect(`/listings/${id}`);
    }

    // Calculate total price server-side (nights * price + 18% GST)
    const timeDiff = requestedCheckOut - requestedCheckIn;
    const nights = Math.max(1, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
    const basePrice = nights * listing.price;
    const taxAmount = Math.round(basePrice * 0.18);
    const totalPrice = basePrice + taxAmount;

    const newBooking = new Booking({
        listing: id,
        guest: req.user._id,
        checkIn: requestedCheckIn,
        checkOut: requestedCheckOut,
        basePrice,
        taxAmount,
        totalPrice,
        status: "pending"
    });

    await newBooking.save();
    req.flash("success", "Booking created successfully! Proceeding to payment...");
    res.redirect(`/bookings/${newBooking._id}/checkout`);
};

module.exports.getBookedDates = async (req, res) => {
    let { id } = req.params;
    const bookings = await Booking.find({
        listing: id,
        status: { $in: ["pending", "confirmed"] }
    }).select("checkIn checkOut");
    res.json(bookings);
};

module.exports.myBookings = async (req, res) => {
    const bookings = await Booking.find({ guest: req.user._id })
        .populate({
            path: "listing",
            select: "title image price location country"
        })
        .sort({ checkIn: 1 });
    res.render("bookings/index.ejs", { bookings });
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
    await booking.save();
    
    // Send confirmation email (async)
    sendBookingConfirmationEmail(booking._id).catch(err => logger.error(err));

    req.flash("success", "Booking confirmed successfully!");
    res.redirect(`/listings/${booking.listing._id}`);
};

module.exports.renderCheckout = async (req, res) => {
    let { bookingId } = req.params;
    let booking = await Booking.findById(bookingId).populate("listing").populate("guest");
    if (!booking) {
        throw new ExpressError(404, "Booking Not Found");
    }

    if (booking.status !== "pending") {
        req.flash("error", `This booking is already ${booking.status}.`);
        return res.redirect("/bookings");
    }

    // Create Razorpay order
    const options = {
        amount: Math.round(booking.totalPrice * 100), // amount in paisa
        currency: "INR",
        receipt: booking._id.toString()
    };

    try {
        const order = await razorpayInstance.orders.create(options);
        res.render("bookings/checkout.ejs", {
            booking,
            order,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID
        });
    } catch (err) {
        throw new ExpressError(500, `Razorpay Order Creation Failed: ${err.message}`);
    }
};

module.exports.verifyPayment = async (req, res) => {
    let { bookingId } = req.params;
    let { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    let booking = await Booking.findById(bookingId);
    if (!booking) {
        throw new ExpressError(404, "Booking Not Found");
    }

    // Verify signature
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest("hex");

    if (generated_signature === razorpay_signature) {
        booking.status = "confirmed";
        booking.paymentId = razorpay_payment_id;
        await booking.save();

        // Send confirmation email (async)
        sendBookingConfirmationEmail(booking._id).catch(err => logger.error(err));

        req.flash("success", "Payment successful! Your booking has been confirmed.");
        res.redirect("/bookings");
    } else {
        throw new ExpressError(400, "Payment signature verification failed.");
    }
};
