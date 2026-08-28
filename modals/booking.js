const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing",
        required: true
    },
    guest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    checkIn: {
        type: Date,
        required: true
    },
    checkOut: {
        type: Date,
        required: true
    },
    basePrice: {
        type: Number,
        default: 0
    },
    taxAmount: {
        type: Number,
        default: 0
    },
    totalPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "cancelled"],
        default: "pending"
    },
    paymentId: {
        type: String,
        default: null
    },
    cancellationReason: {
        type: String,
        default: null
    },
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    cancelledAt: {
        type: Date,
        default: null
    },
    refundId: {
        type: String,
        default: null
    },
    refundStatus: {
        type: String,
        enum: ["not_applicable", "processed", "pending", "failed"],
        default: "not_applicable"
    },
    refundAmount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save validation: checkOut must be after checkIn
bookingSchema.pre("save", function () {
    if (this.checkOut <= this.checkIn) {
        throw new Error("checkOut date must be after checkIn date.");
    }
});

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
