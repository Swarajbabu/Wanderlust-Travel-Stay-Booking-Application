const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review");
const Booking = require("./booking");

const LISTING_CATEGORIES = [
    "Rooms", "Iconic Cities", "Mountains", "Castles", "Amazing Pools",
    "Camping", "Farms", "Arctic", "Mansions", "Caves", "New", "Play",
    "Off-the-grid", "Creative spaces", "Houseboats", "Yurts", "Casas particulares"
];

const LISTING_AMENITIES = [
    "High-Speed Wi-Fi", "Air Conditioning", "Free Parking", "Kitchen",
    "Pool", "Workspace", "Pet Friendly", "Washer",
    "Beach Access", "Mountain View", "Fireplace", "24/7 Check-in"
];

const ListingSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    image: {
        url: String,
        filename: String,
    },
    images: {
        type: [
            {
                url: String,
                filename: String,
            }
        ],
        default: undefined,
    },
    price: Number,
    location: String,
    country: String,
    reviews: [
        {
            type: mongoose.Schema.ObjectId,
            ref: "Review",
        }
    ],
    owner: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
    },
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    category: {
        type: String,
        enum: LISTING_CATEGORIES,
    },
    maxGuests: {
        type: Number,
        default: 4,
        min: 1,
        max: 20
    },
    bedrooms: {
        type: Number,
        default: 1,
        min: 0,
        max: 20
    },
    bathrooms: {
        type: Number,
        default: 1,
        min: 0,
        max: 20
    },
    amenities: {
        type: [String],
        default: ["High-Speed Wi-Fi", "Air Conditioning"]
    },
    houseRules: {
        type: String,
        maxlength: 500,
        default: ""
    },
    allowRoomSharing: {
        type: Boolean,
        default: false
    }
});

ListingSchema.index({ title: "text", location: "text", country: "text" });
ListingSchema.index({ category: 1 });
ListingSchema.index({ price: 1 });
ListingSchema.index({ owner: 1 });
ListingSchema.index({ geometry: "2dsphere" });

ListingSchema.post("findOneAndDelete", async (listing) => {
    if (listing) {
        await Review.deleteMany({
            _id: { $in: listing.reviews },
        });
        // Remove unpaid pending bookings for deleted listings; keep confirmed/cancelled history intact.
        await Booking.deleteMany({
            listing: listing._id,
            status: "pending"
        });
    }
});

const Listing = mongoose.model("Listing", ListingSchema);
Listing.CATEGORIES = LISTING_CATEGORIES;
Listing.AMENITIES = LISTING_AMENITIES;

module.exports = Listing;
