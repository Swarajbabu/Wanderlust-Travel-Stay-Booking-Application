const geminiClient = require("../utility/geminiClient");

/**
 * Returns curated inbuilt prompt suggestions (starter chips) tailored to the current page context.
 * All actual answers are generated strictly by Gemini AI.
 */
function getInbuiltSuggestions(context = {}) {
    const loc = [context.location, context.country].filter(Boolean).join(", ").trim();
    const shortLoc = (context.location || context.country || "").trim();

    if (shortLoc) {
        return [
            `What makes ${shortLoc} special & famous?`,
            `Must-try local food & specialties in ${shortLoc}`,
            `Best nearby places & distances from ${shortLoc}`,
            `Best time to visit & solo travel tips for ${loc}`,
            `How many days are ideal for exploring ${shortLoc}?`
        ];
    }

    return [
        "What makes Manali special & famous?",
        "Distance, travel time & best route from Delhi to Manali",
        "Must-try local food & hidden gems in Goa",
        "Top heritage places & distances in Jaipur",
        "Plan a 3-day trip between Udaipur and Jodhpur"
    ];
}

/**
 * Sends user questions, conversation history, and page context directly to Gemini AI.
 * Never returns hardcoded/inbuilt answers; throws 503 if Gemini AI is unavailable.
 */
async function askTravelAssistant({ message, history = [], context = {} }) {
    const inbuiltSuggestions = getInbuiltSuggestions(context);
    const contextParts = [];
    if (context.title) contextParts.push(`Viewing Stay: "${context.title}"`);
    if (context.location || context.country) {
        contextParts.push(`Current Location Context: ${[context.location, context.country].filter(Boolean).join(", ")}`);
    }
    if (context.category) contextParts.push(`Category: ${context.category}`);
    if (context.price) contextParts.push(`Price/night: ₹${context.price}`);

    const systemInstruction = [
        "You are Wanderlust AI Travel Assistant, a knowledgeable global travel guide inside the Wanderlust stay-booking and itinerary platform.",
        "Every answer you give must be helpful, accurate, and directly address what the user asked — whether it is about ANY place in the world, distances and travel times between places, route options (road/train/flight), local specialties, iconic landmarks, hidden gems, street food, culture, weather/best season, budget, safety, or Wanderlust stays and room-sharing.",
        "When the user asks about distances or routes between places, give approximate distance in km/miles, realistic travel time by road/rail/air when relevant, and helpful stop/route tips.",
        "When the user asks follow-up or related questions (like 'what about food there?' or 'how far is that?'), use the conversation history and current page context naturally.",
        contextParts.length > 0 ? `${contextParts.join(" | ")}.` : "",
        "Respond ONLY with valid JSON matching this exact structure:",
        "{",
        '  "reply": "string (format across multiple short lines separated by \\n: start with a 1-line overview followed by concise - **Topic:** detail bullet lines, 1 sentence per line)",',
        '  "relatedQuestions": ["3 concise, relevant follow-up questions the user might ask next about this place, distance, or topic"],',
        '  "detectedLocation": "string name of the primary city/place or route discussed, or empty string if general"',
        "}"
    ].filter(Boolean).join("\n");

    const trimmedHistory = Array.isArray(history) ? history.slice(-10) : [];
    const contents = [
        ...trimmedHistory.map((item) => ({
            role: item.role === "model" ? "model" : "user",
            parts: [{ text: String(item.text || "").slice(0, 1500) }]
        })),
        {
            role: "user",
            parts: [{ text: String(message || "").trim() }]
        }
    ];

    const geminiResult = await geminiClient.callGeminiJson({
        contents,
        systemInstruction,
        temperature: 0.5,
        timeoutMs: 12000,
        label: `chatbot "${String(message).slice(0, 40)}"`
    });

    if (!geminiResult || typeof geminiResult.reply !== "string" || !geminiResult.reply.trim()) {
        const err = new Error("AI travel assistant is currently unavailable. Please try again in a moment.");
        err.statusCode = 503;
        throw err;
    }

    const detectedLocation = typeof geminiResult.detectedLocation === "string" && geminiResult.detectedLocation.trim()
        ? geminiResult.detectedLocation.trim().slice(0, 100)
        : (context.location ? String(context.location).trim() : null);

    const relatedQuestions = Array.isArray(geminiResult.relatedQuestions)
        ? geminiResult.relatedQuestions
            .filter((q) => typeof q === "string" && q.trim())
            .map((q) => q.trim().slice(0, 140))
            .slice(0, 3)
        : [];

    return {
        reply: geminiResult.reply.trim().slice(0, 2500),
        relatedQuestions,
        detectedLocation: detectedLocation || null,
        inbuiltSuggestions,
        sourceProvider: "gemini"
    };
}

module.exports = {
    askTravelAssistant,
    getInbuiltSuggestions
};
