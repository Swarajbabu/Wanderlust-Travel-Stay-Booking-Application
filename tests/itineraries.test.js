const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Listing = require("../modals/listing");
const User = require("../modals/user");
const Booking = require("../modals/booking");
const TripItinerary = require("../modals/itinerary");

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

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe("AI Personalized Itinerary Generator Tests", () => {
    let travellerCookie;
    let otherCookie;
    let travellerUser;
    let hostUser;
    let manaliListing;

    beforeEach(async () => {
        await TripItinerary.deleteMany({});
        await Booking.deleteMany({});
        await Listing.deleteMany({});
        await User.deleteMany({});

        const resHost = await request(app).post("/signup").type("form").send({
            username: "itin_host",
            email: "itin_host@example.com",
            password: "password123"
        });
        expect(resHost.status).toBe(302);

        const resTrav = await request(app).post("/signup").type("form").send({
            username: "itin_trav",
            email: "itin_trav@example.com",
            password: "password123"
        });
        travellerCookie = resTrav.headers["set-cookie"];

        const resOther = await request(app).post("/signup").type("form").send({
            username: "itin_other",
            email: "itin_other@example.com",
            password: "password123"
        });
        otherCookie = resOther.headers["set-cookie"];

        await User.updateMany({}, { emailVerified: true });
        hostUser = await User.findOne({ username: "itin_host" });
        travellerUser = await User.findOne({ username: "itin_trav" });

        manaliListing = await Listing.create({
            title: "Himalayan Pine Cottage",
            description: "Mountain retreat",
            price: 2500,
            location: "Manali",
            country: "India",
            geometry: { type: "Point", coordinates: [77.1892, 32.2432] },
            owner: hostUser._id
        });
    });

    test("Itinerary validation rejects days outside 1..14", async () => {
        const res = await request(app)
            .post("/itineraries/generate")
            .set("Cookie", travellerCookie)
            .type("form")
            .send({
                "itinerary[destination]": "Manali, India",
                "itinerary[days]": 30,
                "itinerary[dailyHours]": 8
            });

        expect(res.status).toBe(302);
        expect(await TripItinerary.countDocuments({})).toBe(0);
    });

    test("Generates day-wise Manali itinerary with distances, travel times, and saved route", async () => {
        const genRes = await request(app)
            .post("/itineraries/generate")
            .set("Cookie", travellerCookie)
            .type("form")
            .send({
                "itinerary[destination]": "Manali, India",
                "itinerary[days]": 3,
                "itinerary[dailyHours]": 8,
                "itinerary[dailyStartTime]": "09:00",
                "itinerary[pace]": "balanced",
                "itinerary[travelMode]": "driving",
                "itinerary[interests][]": ["Nature", "Adventure", "Culture"],
                "itinerary[listingId]": manaliListing._id.toString()
            });

        expect(genRes.status).toBe(302);

        const saved = await TripItinerary.findOne({ user: travellerUser._id });
        expect(saved).toBeTruthy();
        expect(saved.sourceProvider).toBe("curated_fallback");
        expect(saved.dayPlans.length).toBe(3);
        expect(saved.totalDistanceKm).toBeGreaterThan(0);
        expect(saved.totalTravelMins).toBeGreaterThan(0);
        expect(saved.startCoordinates).toEqual([77.1892, 32.2432]);
        expect(saved.dayPlans[0].stops.length).toBeGreaterThanOrEqual(1);

        // View detail page
        const showRes = await request(app)
            .get(`/itineraries/${saved._id}`)
            .set("Cookie", travellerCookie);
        expect(showRes.status).toBe(200);
        expect(showRes.text).toContain("Manali, India");

        // Unrelated user cannot view or delete itinerary
        const otherView = await request(app)
            .get(`/itineraries/${saved._id}`)
            .set("Cookie", otherCookie);
        expect(otherView.status).toBe(302);

        const otherDel = await request(app)
            .delete(`/itineraries/${saved._id}`)
            .set("Cookie", otherCookie);
        expect(otherDel.status).toBe(302);
        expect(await TripItinerary.findById(saved._id)).toBeTruthy();

        // Owner can delete
        const ownerDel = await request(app)
            .delete(`/itineraries/${saved._id}`)
            .set("Cookie", travellerCookie);
        expect(ownerDel.status).toBe(302);
        expect(await TripItinerary.findById(saved._id)).toBeNull();
    });

    test("Booking-linked planner pre-fills destination and duration", async () => {
        const now = Date.now();
        const booking = await Booking.create({
            listing: manaliListing._id,
            guest: travellerUser._id,
            checkIn: new Date(now + 5 * 24 * 60 * 60 * 1000),
            checkOut: new Date(now + 8 * 24 * 60 * 60 * 1000),
            totalPrice: 8850,
            status: "confirmed"
        });

        const formRes = await request(app)
            .get(`/itineraries/new?bookingId=${booking._id}`)
            .set("Cookie", travellerCookie);

        expect(formRes.status).toBe(200);
        expect(formRes.text).toContain("Manali, India");
        expect(formRes.text).toContain(`value="${booking._id}"`);
        expect(formRes.text).not.toContain("Auto-filled from");
        expect(formRes.text).toContain(`value="3"`);
    });

    test("Listing-linked planner auto-fills destination, duration, pace, and matched interests", async () => {
        const cafeCastle = await Listing.create({
            title: "5-Day Heritage Palace & Artisan Cafe Stay",
            description: "Historic fort palace stay near traditional bazaars, local street food cafes, and panoramic sunset views.",
            location: "Jaipur",
            country: "India",
            price: 3500,
            category: "Castles",
            owner: travellerUser._id,
            geometry: { type: "Point", coordinates: [75.8267, 26.9239] }
        });

        const showRes = await request(app).get(`/listings/${cafeCastle._id}`);
        expect(showRes.status).toBe(200);
        expect(showRes.text).toContain(`data-listing-id="${cafeCastle._id}"`);

        const formRes = await request(app)
            .get(`/itineraries/new?listingId=${cafeCastle._id}`)
            .set("Cookie", travellerCookie);

        expect(formRes.status).toBe(200);
        expect(formRes.text).toContain("Jaipur, India");
        expect(formRes.text).toContain('value="5"');
        expect(formRes.text).not.toContain("Auto-filled from");
        expect(formRes.text).toContain('value="Heritage" id="interest_2" checked');
        expect(formRes.text).toContain('value="Food" id="interest_4" checked');
        expect(formRes.text).toContain('<option value="driving" selected>Cab / Car</option>');
    });
});
