const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const geminiClient = require("../utility/geminiClient");

jest.setTimeout(20000);

let mongoServer;
let app;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGODB_ATLAS = uri;
    process.env.SECRET = "yoursupersecrettestkeyfortesting";
    process.env.NODE_ENV = "test";

    await mongoose.connect(uri);
    app = require("../app");
});

afterEach(() => {
    jest.restoreAllMocks();
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe("Wanderlust AI-Only Travel Chatbot Tests", () => {
    test("GET /api/chat/suggestions returns general and location-tailored inbuilt suggestions", async () => {
        const generalRes = await request(app).get("/api/chat/suggestions");
        expect(generalRes.statusCode).toBe(200);
        expect(generalRes.body.csrfToken).toBeTruthy();
        expect(Array.isArray(generalRes.body.suggestions)).toBe(true);
        expect(generalRes.body.suggestions.length).toBeGreaterThanOrEqual(4);

        const locRes = await request(app)
            .get("/api/chat/suggestions")
            .query({ location: "Manali", country: "India" });
        expect(locRes.statusCode).toBe(200);
        expect(locRes.body.suggestions.some((s) => s.includes("Manali"))).toBe(true);
    });

    test("POST /api/chat rejects empty messages with HTTP 400", async () => {
        const res = await request(app)
            .post("/api/chat")
            .send({ message: "   " });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBeTruthy();
    });

    test("POST /api/chat answers any place or distance question strictly through AI with history and suggestions", async () => {
        const geminiSpy = jest.spyOn(geminiClient, "callGeminiJson")
            .mockResolvedValueOnce({
                reply: "Delhi to Manali is roughly **530 km** via NH-44 and NH-3, taking around **11–12 hours** by car or overnight Volvo.",
                relatedQuestions: [
                    "Which scenic stops are worth taking on the Delhi to Manali drive?",
                    "What makes Old Manali special?",
                    "What local food should I try in Manali?"
                ],
                detectedLocation: "Manali"
            })
            .mockResolvedValueOnce({
                reply: "Along the route, **Pandoh Dam**, **Aut Tunnel valley views**, and **Kullu riverside dhabas** make great short breaks.",
                relatedQuestions: [
                    "How far is Solang Valley from Manali town?",
                    "Best season for the Manali road trip?"
                ],
                detectedLocation: "Manali"
            });

        const firstRes = await request(app)
            .post("/api/chat")
            .send({
                message: "What is the distance and travel time from Delhi to Manali?",
                context: { location: "Manali", country: "India" }
            });

        expect(firstRes.statusCode).toBe(200);
        expect(firstRes.body.sourceProvider).toBe("gemini");
        expect(firstRes.body.reply).toContain("530 km");
        expect(firstRes.body.relatedQuestions).toHaveLength(3);
        expect(Array.isArray(firstRes.body.inbuiltSuggestions)).toBe(true);

        const followUpRes = await request(app)
            .post("/api/chat")
            .send({
                message: "What scenic stops can I take along that route?",
                history: [
                    { role: "user", text: "What is the distance and travel time from Delhi to Manali?" },
                    { role: "model", text: firstRes.body.reply }
                ],
                context: { location: "Manali", country: "India" }
            });

        expect(followUpRes.statusCode).toBe(200);
        expect(followUpRes.body.sourceProvider).toBe("gemini");
        expect(followUpRes.body.reply).toContain("Pandoh Dam");
        expect(geminiSpy).toHaveBeenCalledTimes(2);
    });

    test("POST /api/chat returns HTTP 503 when Gemini AI is unavailable instead of inbuilt canned answers", async () => {
        jest.spyOn(geminiClient, "callGeminiJson").mockResolvedValueOnce(null);

        const res = await request(app)
            .post("/api/chat")
            .send({
                message: "What makes Manali special?",
                context: { location: "Manali", country: "India" }
            });

        expect(res.statusCode).toBe(503);
        expect(res.body.error).toContain("unavailable");
        expect(res.body.reply).toBeUndefined();
    });

    test("GET /listings embeds the floating Travel Chat widget and script", async () => {
        const res = await request(app).get("/listings");
        expect(res.statusCode).toBe(200);
        expect(res.text).toContain("wl-chatbot-root");
        expect(res.text).toContain("wl-chatbot-messages");
        expect(res.text).toContain("/js/chatbot.js");
    });
});
