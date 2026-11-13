const Joi = require("joi");

const CATEGORIES = [
    "Rooms", "Iconic Cities", "Mountains", "Castles", "Amazing Pools",
    "Camping", "Farms", "Arctic", "Mansions", "Caves", "New", "Play",
    "Off-the-grid", "Creative spaces", "Houseboats", "Yurts", "Casas particulares"
];

module.exports.ListingSchema = Joi.object({
    listing: Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
        location: Joi.string().required(),
        country: Joi.string().required(),
        price: Joi.number().required().min(0),
        image: Joi.string().allow("", null),
        category: Joi.string().valid(...CATEGORIES).optional(),
        maxGuests: Joi.number().integer().min(1).max(20).optional(),
        bedrooms: Joi.number().integer().min(0).max(20).optional(),
        bathrooms: Joi.number().integer().min(0).max(20).optional(),
        amenities: Joi.array().items(Joi.string()).single().optional(),
        houseRules: Joi.string().allow("", null).max(500).optional(),
        allowRoomSharing: Joi.boolean().truthy("true", "on", "1").falsy("false", "0", "").optional(),
    }).required(),
    deleteImages: Joi.array().items(Joi.string()).single().optional(),
    _amenitiesSubmitted: Joi.string().optional(),
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
        checkIn: Joi.date().required(),
        checkOut: Joi.date().greater(Joi.ref("checkIn")).required(),
        guests: Joi.number().integer().min(1).max(20).optional(),
        specialRequests: Joi.string().allow("").optional(),
        totalPrice: Joi.number().optional(),
    }).required()
});

module.exports.editBookingDatesSchema = Joi.object({
    booking: Joi.object({
        checkIn: Joi.date().required(),
        checkOut: Joi.date().greater(Joi.ref("checkIn")).required(),
        guests: Joi.number().integer().min(1).max(20).optional(),
    }).required()
});

module.exports.cancelBookingSchema = Joi.object({
    cancellationReason: Joi.string().trim().min(5).max(500).required().messages({
        "string.empty": "Please provide a reason for cancelling this booking.",
        "string.min": "Cancellation reason must be at least 5 characters long.",
        "any.required": "Cancellation reason is required."
    })
});

module.exports.roomShareSchema = Joi.object({
    share: Joi.object({
        listingId: Joi.string().hex().length(24).allow("", null).optional(),
        state: Joi.string().trim().allow("", null).max(100).optional(),
        city: Joi.string().trim().allow("", null).max(100).optional(),
        destination: Joi.string().trim().allow("", null).max(150).optional(),
        category: Joi.string().allow("", null).max(80).optional(),
        maxBudget: Joi.alternatives().try(Joi.number().min(0).max(500000), Joi.string().allow("", null)).optional(),
        checkIn: Joi.date().required(),
        checkOut: Joi.date().greater(Joi.ref("checkIn")).required(),
        maxParticipants: Joi.number().integer().min(2).max(10).required(),
        companionGender: Joi.string().valid("any", "same_gender").optional(),
        smokingPreference: Joi.string().valid("non_smoker", "smoker", "no_preference").optional(),
        sleepSchedule: Joi.string().valid("early_bird", "night_owl", "flexible").optional(),
        note: Joi.string().allow("", null).max(400).optional()
    }).required()
});

module.exports.roomShareSelectStaySchema = Joi.object({
    listingId: Joi.string().hex().length(24).required()
});

module.exports.roomShareJoinSchema = Joi.object({
    introMessage: Joi.string().allow("", null).max(300).optional()
});

module.exports.itineraryRequestSchema = Joi.object({
    itinerary: Joi.object({
        destination: Joi.string().trim().min(2).max(150).required(),
        days: Joi.number().integer().min(1).max(14).required(),
        dailyHours: Joi.number().min(2).max(14).default(8),
        dailyStartTime: Joi.string().pattern(/^\d{2}:\d{2}$/).default("09:00"),
        pace: Joi.string().valid("relaxed", "balanced", "packed").default("balanced"),
        travelMode: Joi.string().valid("driving", "walking", "transit").default("driving"),
        interests: Joi.array().items(Joi.string().trim().max(40)).single().optional(),
        bookingId: Joi.string().allow("", null).optional(),
        listingId: Joi.string().allow("", null).optional()
    }).required()
});

module.exports.chatbotMessageSchema = Joi.object({
    message: Joi.string().trim().min(1).max(1000).required().messages({
        "string.empty": "Please enter a question to ask the Wanderlust Guide.",
        "any.required": "Please enter a question to ask the Wanderlust Guide."
    }),
    history: Joi.array().max(12).items(
        Joi.object({
            role: Joi.string().valid("user", "model").required(),
            text: Joi.string().trim().min(1).max(1500).required()
        })
    ).optional(),
    context: Joi.object({
        location: Joi.string().allow("", null).max(150).optional(),
        country: Joi.string().allow("", null).max(100).optional(),
        title: Joi.string().allow("", null).max(200).optional(),
        category: Joi.string().allow("", null).max(80).optional(),
        price: Joi.alternatives().try(Joi.number(), Joi.string().allow("", null)).optional(),
        page: Joi.string().allow("", null).max(120).optional()
    }).optional()
});
