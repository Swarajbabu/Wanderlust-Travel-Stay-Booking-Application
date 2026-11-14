jest.setTimeout(30000);

const request = require("supertest");
const mongoose = require("mongoose");
const crypto = require("crypto");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Listing = require("../modals/listing");
const User = require("../modals/user");
const Booking = require("../modals/booking");
const RoomSharePool = require("../modals/roomShare");
const { scorePoolCompatibility } = require("../services/companionMatcher");
const { buildLocationTree, findInitialSelection } = require("../utils/locationHierarchy");

jest.mock("razorpay", () => {
    return jest.fn().mockImplementation(() => ({
        orders: {
            create: jest.fn().mockImplementation((options) => Promise.resolve({
                id: `order_share_${Math.floor(Math.random() * 100000)}`,
                amount: options.amount,
                currency: options.currency
            }))
        },
        payments: {
            refund: jest.fn().mockImplementation((paymentId, options) => Promise.resolve({
                id: "rfnd_share_987654",
                entity: "refund",
                amount: options.amount,
                currency: "INR",
                payment_id: paymentId,
                status: "processed"
            }))
        }
    }));
});

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

describe("Solo Room Share & Companion Matching Tests", () => {
    let hostUser;
    let initiatorCookie;
    let partnerCookie;
    let outsiderCookie;
    let initiatorUser;
    let partnerUser;
    let shareListing;
    let privateListing;

    beforeEach(async () => {
        await RoomSharePool.deleteMany({});
        await Booking.deleteMany({});
        await Listing.deleteMany({});
        await User.deleteMany({});

        await request(app).post("/signup").type("form").send({
            username: "share_host",
            email: "share_host@example.com",
            password: "password123"
        });
        const resInit = await request(app).post("/signup").type("form").send({
            username: "solo_init",
            email: "solo_init@example.com",
            password: "password123"
        });
        initiatorCookie = resInit.headers["set-cookie"];

        const resPart = await request(app).post("/signup").type("form").send({
            username: "solo_partner",
            email: "solo_partner@example.com",
            password: "password123"
        });
        partnerCookie = resPart.headers["set-cookie"];

        const resOut = await request(app).post("/signup").type("form").send({
            username: "solo_outsider",
            email: "solo_outsider@example.com",
            password: "password123"
        });
        outsiderCookie = resOut.headers["set-cookie"];

        await User.updateMany({}, { emailVerified: true });

        hostUser = await User.findOne({ username: "share_host" });
        initiatorUser = await User.findOneAndUpdate(
            { username: "solo_init" },
            {
                travelProfile: {
                    gender: "female",
                    preferredCompanionGender: "same_gender",
                    travelStyle: "budget",
                    sleepSchedule: "early_bird",
                    smokingPreference: "non_smoker",
                    interests: ["Mountains", "Photography"],
                    languages: ["English", "Hindi"]
                }
            },
            { returnDocument: "after" }
        );
        partnerUser = await User.findOneAndUpdate(
            { username: "solo_partner" },
            {
                travelProfile: {
                    gender: "female",
                    preferredCompanionGender: "same_gender",
                    travelStyle: "budget",
                    sleepSchedule: "early_bird",
                    smokingPreference: "non_smoker",
                    interests: ["Mountains", "Culture"],
                    languages: ["English"]
                }
            },
            { returnDocument: "after" }
        );

        shareListing = await Listing.create({
            title: "Manali Shared Chalet",
            description: "Cozy mountain stay",
            price: 3000,
            maxGuests: 3,
            allowRoomSharing: true,
            location: "Manali",
            country: "India",
            geometry: { type: "Point", coordinates: [77.1892, 32.2432] },
            owner: hostUser._id
        });

        privateListing = await Listing.create({
            title: "Private Villa",
            description: "No sharing allowed",
            price: 4000,
            maxGuests: 4,
            allowRoomSharing: false,
            location: "Goa",
            country: "India",
            geometry: { type: "Point", coordinates: [73.8567, 15.2993] },
            owner: hostUser._id
        });
    });

    test("Compatibility matcher enforces same-gender & non-smoking rules and scores matches", () => {
        const mockPool = {
            initiator: initiatorUser,
            checkIn: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            checkOut: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            pricePerPerson: 3540,
            preferences: { companionGender: "same_gender", smokingPreference: "non_smoker", sleepSchedule: "early_bird" }
        };

        const compatibleResult = scorePoolCompatibility(partnerUser, mockPool, { maxBudget: 4000 });
        expect(compatibleResult.compatible).toBe(true);
        expect(compatibleResult.score).toBeGreaterThanOrEqual(80);

        const incompatibleGenderUser = {
            emailVerified: true,
            travelProfile: { gender: "male", smokingPreference: "non_smoker" }
        };
        const mismatchResult = scorePoolCompatibility(incompatibleGenderUser, mockPool);
        expect(mismatchResult.compatible).toBe(false);
    });

    test("Pool creation fails on non-shareable listing", async () => {
        const checkIn = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
        const checkOut = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const res = await request(app)
            .post(`/listings/${privateListing._id}/room-shares`)
            .set("Cookie", initiatorCookie)
            .type("form")
            .send({
                "share[checkIn]": checkIn,
                "share[checkOut]": checkOut,
                "share[maxParticipants]": 2
            });

        expect(res.status).toBe(302);
        expect(await RoomSharePool.countDocuments({})).toBe(0);
    });

    test("Full room-share lifecycle: open -> join -> accept -> lock -> split pay -> confirmed booking & chat security", async () => {
        const baseMs = Date.now();
        const checkIn = new Date(baseMs + 6 * 24 * 60 * 60 * 1000).toISOString();
        const checkOut = new Date(baseMs + 8 * 24 * 60 * 60 * 1000).toISOString();

        // 1. Initiator opens pool
        const createRes = await request(app)
            .post(`/listings/${shareListing._id}/room-shares`)
            .set("Cookie", initiatorCookie)
            .type("form")
            .send({
                "share[checkIn]": checkIn,
                "share[checkOut]": checkOut,
                "share[maxParticipants]": 2,
                "share[companionGender]": "same_gender",
                "share[smokingPreference]": "non_smoker",
                "share[sleepSchedule]": "early_bird",
                "share[note]": "Looking to split costs in Manali!"
            });
        expect(createRes.status).toBe(302);

        const pool = await RoomSharePool.findOne({ listing: shareListing._id });
        expect(pool).toBeTruthy();
        expect(pool.totalPrice).toBe(7080); // 2 nights * 3000 + 18% GST
        expect(pool.pricePerPerson).toBe(3540);

        // 2. Marketplace lists the pool
        const listRes = await request(app).get("/room-shares").set("Cookie", partnerCookie);
        expect(listRes.status).toBe(200);
        expect(listRes.text).toContain("Manali Shared Chalet");

        // 3. Outsider cannot post coordination message before acceptance
        const badChatRes = await request(app)
            .post(`/room-shares/${pool._id}/messages`)
            .set("Cookie", outsiderCookie)
            .type("form")
            .send({ text: "Sneaky chat" });
        expect(badChatRes.status).toBe(302);
        expect((await RoomSharePool.findById(pool._id)).messages.length).toBe(0);

        // 4. Compatible partner sends join request
        const joinRes = await request(app)
            .post(`/room-shares/${pool._id}/join`)
            .set("Cookie", partnerCookie)
            .type("form")
            .send({ introMessage: "Hi! Also visiting Manali on the same dates." });
        expect(joinRes.status).toBe(302);

        const afterJoin = await RoomSharePool.findById(pool._id);
        const partnerSubdoc = afterJoin.participants.find((p) => p.user.equals(partnerUser._id));
        expect(partnerSubdoc.joinStatus).toBe("pending");

        // 5. Initiator accepts partner
        const acceptRes = await request(app)
            .patch(`/room-shares/${pool._id}/participants/${partnerSubdoc._id}`)
            .set("Cookie", initiatorCookie)
            .type("form")
            .send({ action: "accept" });
        expect(acceptRes.status).toBe(302);

        // 6. Accepted partner can now post chat message
        const chatRes = await request(app)
            .post(`/room-shares/${pool._id}/messages`)
            .set("Cookie", partnerCookie)
            .type("form")
            .send({ text: "Reaching Manali around 10 AM!" });
        expect(chatRes.status).toBe(302);
        expect((await RoomSharePool.findById(pool._id)).messages.length).toBe(1);

        // 7. Initiator locks pool for split checkout
        const lockRes = await request(app)
            .post(`/room-shares/${pool._id}/lock`)
            .set("Cookie", initiatorCookie);
        expect(lockRes.status).toBe(302);

        // 8. Initiator pays their split share (pool remains locked until partner also pays)
        const initCheckout = await request(app)
            .get(`/room-shares/${pool._id}/checkout`)
            .set("Cookie", initiatorCookie);
        expect(initCheckout.status).toBe(200);

        const poolAfterInitOrder = await RoomSharePool.findById(pool._id);
        const initOrderId = poolAfterInitOrder.participants.find((p) => p.user.equals(initiatorUser._id)).razorpayOrderId;
        const initPayId = "pay_init_111";
        const initSig = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "dummykeysecret12345678")
            .update(`${initOrderId}|${initPayId}`)
            .digest("hex");

        await request(app)
            .post(`/room-shares/${pool._id}/verify-payment`)
            .set("Cookie", initiatorCookie)
            .type("form")
            .send({
                razorpay_payment_id: initPayId,
                razorpay_order_id: initOrderId,
                razorpay_signature: initSig
            });

        const midPool = await RoomSharePool.findById(pool._id);
        expect(midPool.status).toBe("partially_booked");
        expect(midPool.booking).toBeNull();

        // 9. Partner pays their split share -> confirmed shared Booking created
        const partCheckout = await request(app)
            .get(`/room-shares/${pool._id}/checkout`)
            .set("Cookie", partnerCookie);
        expect(partCheckout.status).toBe(200);

        const poolAfterPartOrder = await RoomSharePool.findById(pool._id);
        const partOrderId = poolAfterPartOrder.participants.find((p) => p.user.equals(partnerUser._id)).razorpayOrderId;
        const partPayId = "pay_part_222";
        const partSig = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "dummykeysecret12345678")
            .update(`${partOrderId}|${partPayId}`)
            .digest("hex");

        await request(app)
            .post(`/room-shares/${pool._id}/verify-payment`)
            .set("Cookie", partnerCookie)
            .type("form")
            .send({
                razorpay_payment_id: partPayId,
                razorpay_order_id: partOrderId,
                razorpay_signature: partSig
            });

        const finalPool = await RoomSharePool.findById(pool._id);
        expect(finalPool.status).toBe("confirmed");
        expect(finalPool.booking).toBeTruthy();

        const sharedBooking = await Booking.findById(finalPool.booking);
        expect(sharedBooking.status).toBe("confirmed");
        expect(sharedBooking.isSharedBooking).toBe(true);
        expect(sharedBooking.guests).toBe(2);

        // 10. Cancelling pool refunds both paid participants
        const cancelRes = await request(app)
            .patch(`/room-shares/${pool._id}/cancel`)
            .set("Cookie", initiatorCookie);
        expect(cancelRes.status).toBe(302);

        const cancelledPool = await RoomSharePool.findById(pool._id);
        expect(cancelledPool.status).toBe("cancelled");
        expect(cancelledPool.participants.every((p) => p.paymentStatus === "refunded")).toBe(true);
    });

    test("Solo traveller can view & submit room share directly from /room-shares with category and dates", async () => {
        const hubRes = await request(app).get("/room-shares").set("Cookie", initiatorCookie);
        expect(hubRes.status).toBe(200);
        expect(hubRes.text).toContain('id="hubRoomShareForm"');
        expect(hubRes.text).toContain('name="share[category]"');
        expect(hubRes.text).toContain('name="share[checkIn]"');
        expect(hubRes.text).toContain('name="share[checkOut]"');
        expect(hubRes.text).toContain("Manali Shared Chalet");

        const baseMs = Date.now();
        const checkIn = new Date(baseMs + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        const checkOut = new Date(baseMs + 13 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

        // Outsider (no gender set on profile) submits directly via /room-shares with same_gender
        const postRes = await request(app)
            .post("/room-shares")
            .set("Cookie", outsiderCookie)
            .type("form")
            .send({
                "share[category]": "Mountains",
                "share[listingId]": shareListing._id.toString(),
                "share[checkIn]": checkIn,
                "share[checkOut]": checkOut,
                "share[maxParticipants]": 3,
                "share[companionGender]": "same_gender",
                "share[note]": "Solo trip from hub form"
            });

        expect(postRes.status).toBe(302);
        expect(postRes.headers.location).toBe("/room-shares");

        // Initiator sees their submitted stay immediately on /room-shares and category filter works
        const afterRes = await request(app)
            .get("/room-shares?category=Mountains")
            .set("Cookie", outsiderCookie);
        expect(afterRes.status).toBe(200);
        expect(afterRes.text).toContain("Manali Shared Chalet");
        expect(afterRes.text).toContain("Your Posted Request");

        const otherCatRes = await request(app)
            .get("/room-shares?category=Castles")
            .set("Cookie", outsiderCookie);
        expect(otherCatRes.status).toBe(200);
        expect(otherCatRes.text).toContain("No Matching Room Shares Open Yet");
    });

    test("Destination-first Shimla request -> pre-accept live chat -> select stay -> partially booked state -> reasoned cancel & refund", async () => {
        const shimlaListing = await Listing.create({
            title: "Shimla Mall Road Cedar Room",
            description: "Mountain view stay",
            price: 3000,
            category: "Mountains",
            maxGuests: 3,
            allowRoomSharing: true,
            location: "Shimla",
            country: "India",
            geometry: { type: "Point", coordinates: [77.1734, 31.1048] },
            owner: hostUser._id
        });

        const baseMs = Date.now();
        const checkIn = new Date(baseMs + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        const checkOut = new Date(baseMs + 16 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

        // 1. Solo traveller #1 posts a destination-only Shimla request (no listing chosen yet)
        const postReqRes = await request(app)
            .post("/room-shares")
            .set("Cookie", initiatorCookie)
            .type("form")
            .send({
                "share[destination]": "Shimla",
                "share[category]": "Mountains",
                "share[maxBudget]": "1800",
                "share[checkIn]": checkIn,
                "share[checkOut]": checkOut,
                "share[maxParticipants]": "2",
                "share[note]": "Looking for 1 solo companion in Shimla"
            });
        expect(postReqRes.status).toBe(302);

        const shimlaPool = await RoomSharePool.findOne({ destination: "Shimla", listing: null });
        expect(shimlaPool).toBeTruthy();

        // 2. Solo traveller #2 searches Shimla and sees the request
        const searchRes = await request(app)
            .get("/room-shares?destination=Shimla")
            .set("Cookie", partnerCookie);
        expect(searchRes.status).toBe(200);
        expect(searchRes.text).toContain("Solo Trip to Shimla");

        // 3. Traveller #2 requests to join and immediately chats live before acceptance
        const joinRes = await request(app)
            .post(`/room-shares/${shimlaPool._id}/join`)
            .set("Cookie", partnerCookie)
            .type("form")
            .send({ introMessage: "Coming to Shimla on same dates!" });
        expect(joinRes.status).toBe(302);

        const chatSendRes = await request(app)
            .post(`/room-shares/${shimlaPool._id}/messages`)
            .set("Cookie", partnerCookie)
            .set("Accept", "application/json")
            .send({ text: "Are you okay booking Shimla Mall Road Cedar Room?" });
        expect(chatSendRes.status).toBe(201);

        const chatPollRes = await request(app)
            .get(`/room-shares/${shimlaPool._id}/messages`)
            .set("Cookie", initiatorCookie);
        expect(chatPollRes.status).toBe(200);
        expect(chatPollRes.body.messages.length).toBe(1);

        // 4. Initiator accepts partner, attaches Shimla stay, and locks for split payment
        const updatedAfterJoin = await RoomSharePool.findById(shimlaPool._id);
        const partnerSubdoc = updatedAfterJoin.participants.find((p) => p.role === "partner");

        await request(app)
            .patch(`/room-shares/${shimlaPool._id}/participants/${partnerSubdoc._id}`)
            .set("Cookie", initiatorCookie)
            .type("form")
            .send({ action: "accept" });

        const poolPageBeforeStay = await request(app)
            .get(`/room-shares/${shimlaPool._id}`)
            .set("Cookie", initiatorCookie);
        expect(poolPageBeforeStay.status).toBe(200);
        expect(poolPageBeforeStay.text).toContain('id="stayFilterState"');
        expect(poolPageBeforeStay.text).toContain('id="stayFilterCity"');
        expect(poolPageBeforeStay.text).toContain('id="selectDestinationStay"');
        expect(poolPageBeforeStay.text).toContain('/js/cascadingLocationSelect.js');

        const selectStayRes = await request(app)
            .post(`/room-shares/${shimlaPool._id}/select-stay`)
            .set("Cookie", initiatorCookie)
            .type("form")
            .send({ listingId: shimlaListing._id.toString() });
        expect(selectStayRes.status).toBe(302);

        const lockRes = await request(app)
            .post(`/room-shares/${shimlaPool._id}/lock`)
            .set("Cookie", initiatorCookie);
        expect(lockRes.status).toBe(302);

        // 5. Only first member pays -> becomes partially_booked (room NOT allotted yet)
        await request(app)
            .get(`/room-shares/${shimlaPool._id}/checkout`)
            .set("Cookie", initiatorCookie);
        const lockedPool = await RoomSharePool.findById(shimlaPool._id);
        const initPart = lockedPool.participants.find((p) => p.role === "initiator");
        const initPayId = "pay_shimla_init";
        const initSig = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${initPart.razorpayOrderId}|${initPayId}`)
            .digest("hex");

        await request(app)
            .post(`/room-shares/${shimlaPool._id}/verify-payment`)
            .set("Cookie", initiatorCookie)
            .type("form")
            .send({
                razorpay_payment_id: initPayId,
                razorpay_order_id: initPart.razorpayOrderId,
                razorpay_signature: initSig
            });

        const partialPool = await RoomSharePool.findById(shimlaPool._id);
        expect(partialPool.status).toBe("partially_booked");
        expect(partialPool.booking).toBeNull();

        // Both members see "Partially Booked" status inside /bookings
        const initBookingsRes = await request(app).get("/bookings").set("Cookie", initiatorCookie);
        expect(initBookingsRes.text).toContain("Partially Booked");
        const partnerBookingsRes = await request(app).get("/bookings").set("Cookie", partnerCookie);
        expect(partnerBookingsRes.text).toContain("Partially Booked");

        // 6. Cancelling partially booked pool without reason is rejected
        await request(app)
            .patch(`/room-shares/${shimlaPool._id}/cancel`)
            .set("Cookie", initiatorCookie)
            .type("form")
            .send({ cancellationReason: "no" });
        expect((await RoomSharePool.findById(shimlaPool._id)).status).toBe("partially_booked");

        // 7. Cancelling with valid reason refunds paid share and records reason
        await request(app)
            .patch(`/room-shares/${shimlaPool._id}/cancel`)
            .set("Cookie", initiatorCookie)
            .type("form")
            .send({ cancellationReason: "Companion not responding to chat messages" });

        const cancelledPartial = await RoomSharePool.findById(shimlaPool._id);
        expect(cancelledPartial.status).toBe("cancelled");
        expect(cancelledPartial.cancellationReason).toBe("Companion not responding to chat messages");
        const cancelledInitPart = cancelledPartial.participants.find((p) => p.role === "initiator");
        expect(cancelledInitPart.paymentStatus).toBe("refunded");
    });

    test("buildLocationTree groups strictly existing listing states, cities, and stays", () => {
        const sampleListings = [
            { _id: "111", title: "Snowy Ridge", location: "Shimla, Himachal Pradesh", country: "India", category: "Mountains", price: 6900, maxGuests: 4 },
            { _id: "222", title: "Cedar Chalet", location: "Manali, Himachal Pradesh", country: "India", category: "Mountains", price: 6500, maxGuests: 4 },
            { _id: "333", title: "Desert Camp", location: "Sam Sand Dunes, Jaisalmer, Rajasthan", country: "India", category: "Camping", price: 5500, maxGuests: 4 }
        ];
        const tree = buildLocationTree(sampleListings);
        expect(tree.states).toEqual(["Himachal Pradesh", "Rajasthan"]);
        expect(tree.citiesByState["Himachal Pradesh"]).toEqual(["Manali", "Shimla"]);
        expect(tree.citiesByState["Rajasthan"]).toEqual(["Sam Sand Dunes, Jaisalmer"]);
        expect(tree.stays).toHaveLength(3);

        expect(findInitialSelection({ tree, destination: "Shimla" })).toEqual({
            state: "Himachal Pradesh",
            city: "Shimla",
            listingId: ""
        });
        expect(findInitialSelection({ tree, destination: "Shimali" })).toEqual({
            state: "",
            city: "",
            listingId: ""
        });
    });

    test("GET /room-shares/:poolId/sync returns stateHash, status, paymentSummary and messages", async () => {
        const pool = await RoomSharePool.findOne();
        if (!pool) return;
        const res = await request(app).get(`/room-shares/${pool._id}/sync`).expect(200);
        expect(res.body).toHaveProperty("stateHash");
        expect(res.body).toHaveProperty("status");
        expect(res.body).toHaveProperty("paymentSummary");
        expect(Array.isArray(res.body.messages)).toBe(true);
    });
});
