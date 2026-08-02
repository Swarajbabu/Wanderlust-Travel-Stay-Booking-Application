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
    }
})

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
