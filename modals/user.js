const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose").default;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    authProvider: {
        type: String,
        enum: ["local", "google"],
        default: "local"
    },
    otpHash: String,
    role: { type: String, enum: ["user", "host", "admin"], default: "user" },
    wishlist: [{ type: Schema.Types.ObjectId, ref: "Listing" }],
    bio: { type: String, maxlength: 300, default: "" },
    phone: { type: String, maxlength: 30, default: "" },
    avatar: { url: { type: String, default: "" }, filename: { type: String, default: "" } },
    travelProfile: {
        gender: {
            type: String,
            enum: ["prefer_not_to_say", "male", "female", "non_binary"],
            default: "prefer_not_to_say"
        },
        preferredCompanionGender: {
            type: String,
            enum: ["any", "same_gender"],
            default: "any"
        },
        travelStyle: {
            type: String,
            enum: ["budget", "balanced", "comfort", "adventure"],
            default: "balanced"
        },
        sleepSchedule: {
            type: String,
            enum: ["early_bird", "night_owl", "flexible"],
            default: "flexible"
        },
        smokingPreference: {
            type: String,
            enum: ["non_smoker", "smoker", "no_preference"],
            default: "no_preference"
        },
        interests: {
            type: [String],
            default: []
        },
        languages: {
            type: [String],
            default: ["English"]
        }
    },
    otpExpiresAt: Date,
    emailVerified: {
        type: Boolean,
        default: false
    }
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User",userSchema); 
