const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const wrapAsync = require("../utility/wrapAsync");
const chatbotController = require("../controllers/chatbot");

const chatLimiter = process.env.NODE_ENV === "test"
    ? (req, res, next) => next()
    : rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 40,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            res.status(429).json({
                error: "You are chatting fast! Please wait a minute before sending another question."
            });
        }
    });

router.get("/api/chat/suggestions", chatbotController.getSuggestions);
router.post("/api/chat", chatLimiter, wrapAsync(chatbotController.postChatMessage));

module.exports = router;
