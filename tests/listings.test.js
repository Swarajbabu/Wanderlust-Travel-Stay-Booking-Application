const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Listing = require("../modals/listing");
const User = require("../modals/user");

let mongoServer;
let app;
jest.setTimeout(20000);

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


describe("Demo Mode Authz, Wishlist & Host Dashboard Tests", () => {
    let ownerCookie;
    let demoGuestCookie;

    beforeEach(async () => {
        await Listing.deleteMany({});
        await User.deleteMany({});
        delete process.env.ENABLE_DEMO_MODE;

        const resA = await request(app)
            .post("/signup")
            .type("form")
            .send({ username: "host_user", email: "host_user@example.com", password: "password123" });
        ownerCookie = resA.headers["set-cookie"];

        const resG = await request(app)
            .post("/signup")
            .type("form")
            .send({ username: "guest_user", email: "guest_demo@example.com", password: "password123" });
        demoGuestCookie = resG.headers["set-cookie"];

        await User.updateMany({}, { emailVerified: true });
    });

    test("guest_user cannot edit or delete another host's listing when ENABLE_DEMO_MODE is disabled", async () => {
        await request(app)
            .post("/listings")
            .set("Cookie", ownerCookie)
            .type("form")
            .send({
                "listing[title]": "Protected Stay",
                "listing[description]": "Safe stay",
                "listing[price]": 180,
                "listing[location]": "Jaipur",
                "listing[country]": "India",
                "listing[category]": "Rooms"
            });

        const listing = await Listing.findOne({ title: "Protected Stay" });
        expect(listing).toBeTruthy();

        const putRes = await request(app)
            .put(`/listings/${listing._id}`)
            .set("Cookie", demoGuestCookie)
            .type("form")
            .send({
                "listing[title]": "Overwritten",
                "listing[description]": "Nope",
                "listing[price]": 99,
                "listing[location]": "Jaipur",
                "listing[country]": "India",
                "listing[category]": "Rooms"
            });
        expect(putRes.status).toBe(302);
        const unchanged = await Listing.findById(listing._id);
        expect(unchanged.title).toBe("Protected Stay");

        const delRes = await request(app)
            .delete(`/listings/${listing._id}`)
            .set("Cookie", demoGuestCookie);
        expect(delRes.status).toBe(302);
        expect(await Listing.findById(listing._id)).toBeTruthy();
    });

    test("Wishlist toggle and Saved Stays page work for authenticated user", async () => {
        const ownerUser = await User.findOne({ username: "host_user" });
        const listing = await Listing.create({
            title: "Wishlist Villa",
            description: "Lakefront villa",
            price: 220,
            location: "Udaipur",
            country: "India",
            category: "Amazing Pools",
            geometry: { type: "Point", coordinates: [73.7125, 24.5854] },
            owner: ownerUser._id
        });

        const saveRes = await request(app)
            .post(`/listings/${listing._id}/wishlist`)
            .set("Cookie", demoGuestCookie)
            .set("Accept", "application/json");
        expect(saveRes.status).toBe(200);
        expect(saveRes.body.saved).toBe(true);
        expect(saveRes.body.count).toBe(1);

        const pageRes = await request(app)
            .get("/wishlist")
            .set("Cookie", demoGuestCookie);
        expect(pageRes.status).toBe(200);
        expect(pageRes.text).toContain("Wishlist Villa");

        const unsaveRes = await request(app)
            .post(`/listings/${listing._id}/wishlist`)
            .set("Cookie", demoGuestCookie)
            .set("Accept", "application/json");
        expect(unsaveRes.status).toBe(200);
        expect(unsaveRes.body.saved).toBe(false);
        expect(unsaveRes.body.count).toBe(0);
    });

    test("Host Dashboard renders host listings", async () => {
        const ownerUser = await User.findOne({ username: "host_user" });
        await Listing.create({
            title: "Host Dashboard Cottage",
            description: "Mountain view",
            price: 140,
            location: "Manali",
            country: "India",
            category: "Mountains",
            geometry: { type: "Point", coordinates: [77.1892, 32.2432] },
            owner: ownerUser._id
        });

        const dashRes = await request(app)
            .get("/host/dashboard")
            .set("Cookie", ownerCookie);
        expect(dashRes.status).toBe(200);
        expect(dashRes.text).toContain("Host Dashboard Cottage");
    });

    test("Homepage listings render with lazy loading and JSON pagination API", async () => {
        const ownerUser = await User.findOne({ username: "host_user" });
        // Create 15 listings to test multiple pages
        const listingsToInsert = [];
        for (let i = 1; i <= 15; i++) {
            listingsToInsert.push({
                title: `Lazy Stay ${i}`,
                description: `Beautiful place ${i}`,
                price: 1000 + i * 100,
                location: "Goa",
                country: "India",
                category: "Rooms",
                geometry: { type: "Point", coordinates: [73.8567, 15.2993] },
                owner: ownerUser._id
            });
        }
        await Listing.insertMany(listingsToInsert);

        // 1. HTML request renders lazy loading container, sentinel, and NO numbered pagination
        const htmlRes = await request(app).get("/listings");
        expect(htmlRes.status).toBe(200);
        expect(htmlRes.text).toContain('id="lazyLoadContainer"');
        expect(htmlRes.text).toContain('id="lazyLoadSentinel"');
        expect(htmlRes.text).toContain('id="lazyLoadSpinner"');
        expect(htmlRes.text).not.toContain('aria-label="Page navigation"');
        expect(htmlRes.text).not.toContain('&laquo; Previous');
        expect(htmlRes.text).not.toContain('Next &raquo;');

        // 2. JSON request for page 1 returns first batch and hasMore: true
        const jsonResPage1 = await request(app)
            .get("/listings?page=1")
            .set("Accept", "application/json");
        expect(jsonResPage1.status).toBe(200);
        expect(jsonResPage1.body.currentPage).toBe(1);
        expect(jsonResPage1.body.totalPages).toBeGreaterThan(1);
        expect(jsonResPage1.body.listings.length).toBe(12);
        expect(jsonResPage1.body.hasMore).toBe(true);

        // 3. JSON request for page 2 returns remaining items and hasMore: false
        const jsonResPage2 = await request(app)
            .get("/listings?page=2&format=json");
        expect(jsonResPage2.status).toBe(200);
        expect(jsonResPage2.body.currentPage).toBe(2);
        expect(jsonResPage2.body.listings.length).toBeGreaterThan(0);
        expect(jsonResPage2.body.hasMore).toBe(false);
    });
});
