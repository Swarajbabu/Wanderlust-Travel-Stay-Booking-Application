const { ref } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review");

// Schema 
const ListingSchema = Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    image: {
        url: String,
        filename: String,
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
        enum: ["Rooms", "Iconic Cities", "Mountains", "Castles", "Amazing Pools", "Camping", "Farms", "Arctic", "Mansions", "Caves", "New", "Play", "Off-the-grid", "Creative spaces", "Houseboats", "Yurts", "Casas particulares"],
    }
});

ListingSchema.index({ title: "text", location: "text", country: "text" });

ListingSchema.post("findOneAndDelete", async (listing) => {
    if (listing) {
        await Review.deleteMany({
            _id: { $in: listing.reviews },
        });
    }
});

// Modal creation or collection creation
const Listing = mongoose.model("Listing", ListingSchema);

// Expotiing the Listing
module.exports = Listing;
