const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const stopSchema = new Schema({
    order: { type: Number, required: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, default: "Sightseeing" },
    description: { type: String, default: "" },
    coordinates: {
        type: [Number],
        default: [78.4867, 17.3850]
    },
    bestTimeOfDay: {
        type: String,
        enum: ["morning", "afternoon", "evening", "any"],
        default: "any"
    },
    arrivalTime: { type: String, default: "" },
    durationMins: { type: Number, default: 90, min: 15, max: 480 },
    distanceFromPrevKm: { type: Number, default: 0, min: 0 },
    travelMinsFromPrev: { type: Number, default: 0, min: 0 },
    tips: { type: String, default: "" }
}, { _id: false });

const dayPlanSchema = new Schema({
    dayNumber: { type: Number, required: true },
    theme: { type: String, default: "" },
    estimatedDistanceKm: { type: Number, default: 0 },
    estimatedTravelMins: { type: Number, default: 0 },
    stops: [stopSchema]
}, { _id: false });

const itinerarySchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    booking: {
        type: Schema.Types.ObjectId,
        ref: "Booking",
        default: null
    },
    listing: {
        type: Schema.Types.ObjectId,
        ref: "Listing",
        default: null
    },
    destination: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150
    },
    startCoordinates: {
        type: [Number],
        default: [78.4867, 17.3850]
    },
    days: {
        type: Number,
        required: true,
        min: 1,
        max: 14
    },
    dailyStartTime: {
        type: String,
        default: "09:00"
    },
    dailyHours: {
        type: Number,
        default: 8,
        min: 2,
        max: 14
    },
    pace: {
        type: String,
        enum: ["relaxed", "balanced", "packed"],
        default: "balanced"
    },
    travelMode: {
        type: String,
        enum: ["driving", "walking", "transit"],
        default: "driving"
    },
    interests: {
        type: [String],
        default: []
    },
    sourceProvider: {
        type: String,
        enum: ["gemini", "curated_fallback"],
        default: "curated_fallback"
    },
    totalDistanceKm: {
        type: Number,
        default: 0
    },
    totalTravelMins: {
        type: Number,
        default: 0
    },
    dayPlans: [dayPlanSchema],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

itinerarySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("TripItinerary", itinerarySchema);
