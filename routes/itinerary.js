const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const wrapAsync = require("../utility/wrapAsync");
const { isLoggedIn, validateItineraryRequest } = require("../middleware.js");
const itineraryController = require("../controllers/itinerary.js");

const itineraryLimiter = process.env.NODE_ENV === "test"
    ? (req, res, next) => next()
    : rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 15,
        handler: (req, res) => {
            req.flash("error", "Too many itinerary generation requests. Please wait a few minutes.");
            res.redirect("/itineraries/new");
        }
    });

router.get("/itineraries", isLoggedIn, wrapAsync(itineraryController.listItineraries));
router.get("/itineraries/new", isLoggedIn, wrapAsync(itineraryController.renderPlanner));
router.post("/itineraries/generate", isLoggedIn, itineraryLimiter, validateItineraryRequest, wrapAsync(itineraryController.generateItinerary));
router.get("/itineraries/:id", isLoggedIn, wrapAsync(itineraryController.showItinerary));
router.delete("/itineraries/:id", isLoggedIn, wrapAsync(itineraryController.deleteItinerary));

module.exports = router;
