const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const participantSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    role: {
        type: String,
        enum: ["initiator", "partner"],
        default: "partner"
    },
    joinStatus: {
        type: String,
        enum: ["pending", "accepted", "rejected", "left"],
        default: "pending"
    },
    paymentStatus: {
        type: String,
        enum: ["unpaid", "paid", "refunded"],
        default: "unpaid"
    },
    amountDue: {
        type: Number,
        default: 0
    },
    razorpayOrderId: {
        type: String,
        default: null
    },
    paymentId: {
        type: String,
        default: null
    },
    refundId: {
        type: String,
        default: null
    },
    introMessage: {
        type: String,
        maxlength: 300,
        default: ""
    },
    joinedAt: {
        type: Date,
        default: Date.now
    }
});

const poolMessageSchema = new Schema({
    sender: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    text: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const roomSharePoolSchema = new Schema({
    listing: {
        type: Schema.Types.ObjectId,
        ref: "Listing",
        required: false,
        default: null
    },
    destination: {
        type: String,
        trim: true,
        maxlength: 150,
        default: ""
    },
    initiator: {
        type: Schema.Types.ObjectId,
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
    maxParticipants: {
        type: Number,
        default: 2,
        min: 2,
        max: 10
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
        default: 0
    },
    pricePerPerson: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ["open", "locked", "partially_booked", "confirmed", "cancelled", "expired"],
        default: "open"
    },
    expiresAt: {
        type: Date,
        default: null
    },
    booking: {
        type: Schema.Types.ObjectId,
        ref: "Booking",
        default: null
    },
    cancellationReason: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ""
    },
    cancelledBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    cancelledAt: {
        type: Date,
        default: null
    },
    preferences: {
        category: {
            type: String,
            trim: true,
            maxlength: 80,
            default: ""
        },
        maxBudget: {
            type: Number,
            default: 0
        },
        companionGender: {
            type: String,
            enum: ["any", "same_gender"],
            default: "any"
        },
        smokingPreference: {
            type: String,
            enum: ["non_smoker", "smoker", "no_preference"],
            default: "no_preference"
        },
        sleepSchedule: {
            type: String,
            enum: ["early_bird", "night_owl", "flexible"],
            default: "flexible"
        },
        note: {
            type: String,
            maxlength: 400,
            default: ""
        }
    },
    participants: [participantSchema],
    messages: [poolMessageSchema],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

roomSharePoolSchema.index({ listing: 1, status: 1, checkIn: 1, checkOut: 1 });
roomSharePoolSchema.index({ status: 1, checkIn: 1 });
roomSharePoolSchema.index({ initiator: 1, createdAt: -1 });

module.exports = mongoose.model("RoomSharePool", roomSharePoolSchema);
