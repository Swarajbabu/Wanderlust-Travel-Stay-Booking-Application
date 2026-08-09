const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Listing = require("../modals/listing");
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

describe("Listing CRUD and Authz Tests", () => {
    let ownerCookie;
    let nonOwnerCookie;

    beforeEach(async () => {
        await Listing.deleteMany({});
        await User.deleteMany({});

        // Signup owner
        const resA = await request(app)
            .post("/signup")
            .type("form")
            .send({ username: "owner", email: "owner@example.com", password: "password123" });
        ownerCookie = resA.headers["set-cookie"];

        // Signup non-owner
        const resB = await request(app)
            .post("/signup")
            .type("form")
            .send({ username: "nonowner", email: "nonowner@example.com", password: "password123" });
        nonOwnerCookie = resB.headers["set-cookie"];

        // Verify emails programmatically to allow listing creation
        await User.updateMany({}, { emailVerified: true });
    });

    test("Owner can create, read, update, and delete listing", async () => {
        // 1. Create listing
        const createRes = await request(app)
            .post("/listings")
            .set("Cookie", ownerCookie)
            .type("form")
            .send({
                "listing[title]": "Villa Owner",
                "listing[description]": "Description",
                "listing[price]": 100,
                "listing[location]": "Goa",
                "listing[country]": "India",
                "listing[category]": "Rooms"
            });

        expect(createRes.status).toBe(302);
        
        // Find created listing
        const listing = await Listing.findOne({ title: "Villa Owner" });
        expect(listing).toBeTruthy();
        expect(listing.price).toBe(100);

        // 2. Read listing details page
        const readRes = await request(app).get(`/listings/${listing._id}`);
        expect(readRes.status).toBe(200);
        expect(readRes.text).toContain("Villa Owner");

        // 3. Update listing
        const updateRes = await request(app)
            .put(`/listings/${listing._id}`)
            .set("Cookie", ownerCookie)
            .type("form")
            .send({
                "listing[title]": "Updated Villa Owner",
                "listing[price]": 200,
                "listing[description]": "New description",
                "listing[location]": "Goa",
                "listing[country]": "India",
                "listing[category]": "Rooms"
            });
        expect(updateRes.status).toBe(302);

        const updatedListing = await Listing.findById(listing._id);
        expect(updatedListing.title).toBe("Updated Villa Owner");
        expect(updatedListing.price).toBe(200);

        // 4. Delete listing
        const deleteRes = await request(app)
            .delete(`/listings/${listing._id}`)
            .set("Cookie", ownerCookie);
        expect(deleteRes.status).toBe(302);

        const deletedListing = await Listing.findById(listing._id);
        expect(deletedListing).toBeNull();
    });

    test("Non-owner cannot update or delete listing", async () => {
        // Create listing as owner
        await request(app)
            .post("/listings")
            .set("Cookie", ownerCookie)
            .type("form")
            .send({
                "listing[title]": "Villa Safe",
                "listing[description]": "Description",
                "listing[price]": 100,
                "listing[location]": "Mumbai",
                "listing[country]": "India",
                "listing[category]": "Rooms"
            });

        const listing = await Listing.findOne({ title: "Villa Safe" });
        expect(listing).toBeTruthy();

        // Attempt update as non-owner
        const updateRes = await request(app)
            .put(`/listings/${listing._id}`)
            .set("Cookie", nonOwnerCookie)
            .type("form")
            .send({
                "listing[title]": "Hacked Title",
                "listing[price]": 150
            });
        
        expect(updateRes.status).toBe(302);
        
        const checkListing = await Listing.findById(listing._id);
        expect(checkListing.title).toBe("Villa Safe"); // Unchanged!

        // Attempt delete as non-owner
        const deleteRes = await request(app)
            .delete(`/listings/${listing._id}`)
            .set("Cookie", nonOwnerCookie);
            
        expect(deleteRes.status).toBe(302);
        
        const checkListingDelete = await Listing.findById(listing._id);
        expect(checkListingDelete).toBeTruthy(); // Still exists!
    });
});
