const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Booking = require("../modals/booking");
const Listing = require("../modals/listing");
const Review = require("../modals/review");
const User = require("../modals/user");

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

describe("Review Eligibility and Duplicate Prevention Tests", () => {
    let ownerCookie;
    let guestCookie;
    let guestUser;
    let listing;

    beforeEach(async () => {
        await Review.deleteMany({});
        await Booking.deleteMany({});
        await Listing.deleteMany({});
        await User.deleteMany({});

        const resOwner = await request(app)
            .post("/signup")
            .type("form")
            .send({ username: "rev_owner", email: "rev_owner@example.com", password: "password123" });
        ownerCookie = resOwner.headers["set-cookie"];

        const resGuest = await request(app)
            .post("/signup")
            .type("form")
            .send({ username: "rev_guest", email: "rev_guest@example.com", password: "password123" });
        guestCookie = resGuest.headers["set-cookie"];

        await User.updateMany({}, { emailVerified: true });
        const ownerUser = await User.findOne({ username: "rev_owner" });
        guestUser = await User.findOne({ username: "rev_guest" });

        listing = await Listing.create({
            title: "Reviewed Loft",
            description: "Cozy loft",
            price: 120,
            location: "Pune",
            country: "India",
            category: "Rooms",
            geometry: { type: "Point", coordinates: [73.8567, 18.5204] },
            owner: ownerUser._id
        });
    });

    test("User cannot post a review without a completed confirmed booking", async () => {
        const res = await request(app)
            .post(`/listings/${listing._id}/reviews`)
            .set("Cookie", guestCookie)
            .type("form")
            .send({
                "review[rating]": 5,
                "review[comment]": "Great stay!"
            });

        expect(res.status).toBe(302);
        const count = await Review.countDocuments({});
        expect(count).toBe(0);
    });

    test("User with completed stay can post one review and duplicate review is rejected", async () => {
        await Booking.create({
            listing: listing._id,
            guest: guestUser._id,
            checkIn: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            checkOut: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            totalPrice: 360,
            status: "confirmed",
            paymentId: "pay_completed_stay"
        });

        // First review succeeds
        const firstRes = await request(app)
            .post(`/listings/${listing._id}/reviews`)
            .set("Cookie", guestCookie)
            .type("form")
            .send({
                "review[rating]": 5,
                "review[comment]": "Amazing hospitality!"
            });

        expect(firstRes.status).toBe(302);
        expect(await Review.countDocuments({})).toBe(1);

        // Second review by same user on same listing is rejected
        const secondRes = await request(app)
            .post(`/listings/${listing._id}/reviews`)
            .set("Cookie", guestCookie)
            .type("form")
            .send({
                "review[rating]": 4,
                "review[comment]": "Duplicate attempt"
            });

        expect(secondRes.status).toBe(302);
        expect(await Review.countDocuments({})).toBe(1);
    });
});
