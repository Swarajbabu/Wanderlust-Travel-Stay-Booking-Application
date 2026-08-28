const Joi = require("joi");

module.exports.ListingSchema = Joi.object({
    listing: Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
        location: Joi.string().required(),
        country: Joi.string().required(),
        price: Joi.number().required().min(0),
        image: Joi.string().allow("", null),
        category: Joi.string().valid("Rooms", "Iconic Cities", "Mountains", "Castles", "Amazing Pools", "Camping", "Farms", "Arctic", "Mansions", "Caves", "New", "Play", "Off-the-grid", "Creative spaces", "Houseboats", "Yurts", "Casas particulares").optional(),
    }).required(),
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        comment: Joi.string().required()
    }).required()
});

module.exports.bookingSchema = Joi.object({
    booking: Joi.object({
        listing: Joi.string().optional(),
        checkIn: Joi.date().min("now").required(),
        checkOut: Joi.date().greater(Joi.ref("checkIn")).required(),
        totalPrice: Joi.number().optional(),
    }).required()
});

module.exports.cancelBookingSchema = Joi.object({
    cancellationReason: Joi.string().trim().min(5).max(500).required().messages({
        "string.empty": "Please provide a reason for cancelling this booking.",
        "string.min": "Cancellation reason must be at least 5 characters long.",
        "any.required": "Cancellation reason is required."
    })
});