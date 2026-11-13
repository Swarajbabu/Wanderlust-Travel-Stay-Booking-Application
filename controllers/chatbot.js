const { chatbotMessageSchema } = require("../schema");
const { askTravelAssistant, getInbuiltSuggestions } = require("../services/chatbotService");

module.exports.getSuggestions = (req, res) => {
    const { location, country, title } = req.query;
    const suggestions = getInbuiltSuggestions({ location, country, title });
    return res.json({ suggestions, csrfToken: res.locals.csrfToken });
};

module.exports.postChatMessage = async (req, res) => {
    const { error, value } = chatbotMessageSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const msg = error.details.map((d) => d.message).join(", ");
        return res.status(400).json({ error: msg });
    }

    try {
        const result = await askTravelAssistant(value);
        return res.json(result);
    } catch (err) {
        return res.status(err.statusCode || 503).json({
            error: err.message || "AI travel assistant is currently unavailable. Please try again."
        });
    }
};
