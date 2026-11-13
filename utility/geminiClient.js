const logger = require("../config/logger");

function getGeminiCandidateModels() {
    return [...new Set([
        process.env.GEMINI_MODEL || "gemini-flash-lite-latest",
        "gemini-flash-lite-latest",
        "gemini-3.5-flash",
        "gemini-flash-latest"
    ].filter(Boolean))];
}

/**
 * Invokes Google Gemini generateContent with automatic model fallback and strict JSON parsing.
 * Returns null in test mode, when GEMINI_API_KEY is unset, or if every candidate model fails.
 */
async function callGeminiJson({
    prompt,
    contents,
    systemInstruction,
    temperature = 0.4,
    timeoutMs = 9000,
    label = "Gemini request"
}) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || process.env.NODE_ENV === "test" || typeof fetch !== "function") {
        return null;
    }

    const requestBody = {
        contents: Array.isArray(contents) && contents.length > 0
            ? contents
            : [{ role: "user", parts: [{ text: String(prompt || "") }] }],
        generationConfig: {
            responseMimeType: "application/json",
            temperature
        }
    };

    if (systemInstruction) {
        requestBody.systemInstruction = {
            parts: [{ text: String(systemInstruction) }]
        };
    }

    const candidateModels = getGeminiCandidateModels();
    for (const model of candidateModels) {
        try {
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
            const resp = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
                signal: AbortSignal.timeout(timeoutMs)
            });

            if (!resp.ok) {
                logger.warn(`Gemini model ${model} returned ${resp.status} for ${label}`);
                continue;
            }

            const payload = await resp.json();
            const rawText = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!rawText) continue;

            const cleaned = rawText
                .trim()
                .replace(/^```(?:json)?\s*/i, "")
                .replace(/\s*```$/i, "");

            return JSON.parse(cleaned);
        } catch (err) {
            logger.warn(`Gemini model ${model} error for ${label}: ${err.message}`);
        }
    }

    return null;
}

module.exports = {
    callGeminiJson,
    getGeminiCandidateModels
};
