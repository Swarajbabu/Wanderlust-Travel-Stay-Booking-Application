const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Schema 
const ListingSchema = Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    image: {
        type: String,
        default: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
        set: (v) => v === '' ? "https://images.unsplash.com/photo-1506744038136-46273834b3fb" : v
    },
    price: Number,
    location: String,
    country: String
})

// Modal creation or collection creation
const Listing = mongoose.model("Listing",ListingSchema);

// Expotiing the Listing
module.exports = Listing;
