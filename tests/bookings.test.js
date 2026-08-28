const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const Booking = require("../modals/booking");
const Listing = require("../modals/listing");
const User = require("../modals/user");
const crypto = require("crypto");

jest.mock("razorpay", () => {
    return jest.fn().mockImplementation(() => {
        return {
            orders: {
                create: jest.fn().mockImplementation((options) => {
                    return Promise.resolve({
                        id: "order_test_123456",
                        amount: options.amount,
                        currency: options.currency
                    });
                })
            },
            payments: {
                refund: jest.fn().mockImplementation((paymentId, options) => {
                    return Promise.resolve({
                        id: "rfnd_test_987654",
                        entity: "refund",
                        amount: options.amount,
                        currency: "INR",
                        payment_id: paymentId,
                        status: "processed"
                    });
                })
            }
        };
    });
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

describe("Booking Business Logic Tests", () => {
    let ownerCookie;
    let guestCookie;
    let listing;

    beforeEach(async () => {
        await Booking.deleteMany({});
        await Listing.deleteMany({});
        await User.deleteMany({});

        // Signup owner
        const resA = await request(app)
            .post("/signup")
            .type("form")
            .send({ username: "owner", email: "owner@example.com", password: "password" });
        ownerCookie = resA.headers["set-cookie"];

        // Signup guest
        const resB = await request(app)
            .post("/signup")
            .type("form")
            .send({ username: "guest", email: "guest@example.com", password: "password" });
        guestCookie = resB.headers["set-cookie"];

        // Verify emails programmatically to allow booking & listing operations
        await User.updateMany({}, { emailVerified: true });

        const ownerUser = await User.findOne({ username: "owner" });

        // Create listing (150 per night)
        listing = new Listing({
            title: "Booking Stay",
            description: "Description",
            price: 150,
            location: "Goa",
            country: "India",
            geometry: { type: "Point", coordinates: [73.8567, 15.2993] },
            owner: ownerUser._id
        });
        await listing.save();
    });

    test("Non-overlapping booking succeeds and calculates price correctly", async () => {
        // Today to 3 days later (3 nights)
        const checkIn = new Date(Date.now() + 60000);
        const checkOut = new Date(checkIn.getTime() + 3 * 24 * 60 * 60 * 1000);

        const res = await request(app)
            .post(`/listings/${listing._id}/bookings`)
            .set("Cookie", guestCookie)
            .type("form")
            .send({
                "booking[checkIn]": checkIn.toISOString(),
                "booking[checkOut]": checkOut.toISOString(),
                "booking[totalPrice]": 0 // Client tries to submit 0 price!
            });

        expect(res.status).toBe(302); // Redirect back on success
        
        const booking = await Booking.findOne({ listing: listing._id });
        expect(booking).toBeTruthy();
        expect(booking.status).toBe("pending");
        // Total price should be calculated correctly server-side (3 nights * 150 = 450 base + 18% GST (81) = 531)
        expect(booking.basePrice).toBe(450);
        expect(booking.taxAmount).toBe(81);
        expect(booking.totalPrice).toBe(531);
    });

    test("Overlapping bookings are rejected", async () => {
        const baseDate = new Date(Date.now() + 60000);

        // Pre-create a confirmed booking: Days 2 to 5
        const checkIn1 = new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000);
        const checkOut1 = new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000);

        const b1 = new Booking({
            listing: listing._id,
            guest: new mongoose.Types.ObjectId(),
            checkIn: checkIn1,
            checkOut: checkOut1,
            totalPrice: 450,
            status: "confirmed"
        });
        await b1.save();

        // Try booking overlapping range: Days 3 to 4 (fully inside)
        const checkIn2 = new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000);
        const checkOut2 = new Date(baseDate.getTime() + 4 * 24 * 60 * 60 * 1000);

        const resOverlap = await request(app)
            .post(`/listings/${listing._id}/bookings`)
            .set("Cookie", guestCookie)
            .type("form")
            .send({
                "booking[checkIn]": checkIn2.toISOString(),
                "booking[checkOut]": checkOut2.toISOString()
            });

        expect(resOverlap.status).toBe(302);
        
        // Count bookings for this listing, should only be the pre-created one (count = 1)
        const bookingsCount = await Booking.countDocuments({ listing: listing._id });
        expect(bookingsCount).toBe(1);

        // Try booking non-overlapping range: Days 5 to 7 (checkout on checkIn day of b1 is allowed, but checkIn on checkOut is also allowed)
        const checkInOk = new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000);
        const checkOutOk = new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000);

        const resOk = await request(app)
            .post(`/listings/${listing._id}/bookings`)
            .set("Cookie", guestCookie)
            .type("form")
            .send({
                "booking[checkIn]": checkInOk.toISOString(),
                "booking[checkOut]": checkOutOk.toISOString()
            });

        expect(resOk.status).toBe(302);
        
        const newCount = await Booking.countDocuments({ listing: listing._id });
        expect(newCount).toBe(2); // Successfully added!
    });

    test("Razorpay payment verification flow confirms booking", async () => {
        const guestUser = await User.findOne({ username: "guest" });
        
        const booking = new Booking({
            listing: listing._id,
            guest: guestUser._id,
            checkIn: new Date(Date.now() + 60000),
            checkOut: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            totalPrice: 300,
            status: "pending"
        });
        await booking.save();

        // 2. Perform checkout GET (should return 200 and render order page)
        const resCheckout = await request(app)
            .get(`/bookings/${booking._id}/checkout`)
            .set("Cookie", guestCookie);

        expect(resCheckout.status).toBe(200);

        // 3. Generate correct signature for test verification
        const razorpay_order_id = "order_test_123456";
        const razorpay_payment_id = "pay_test_789101";
        const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "dummykeysecret12345678");
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const razorpay_signature = hmac.digest("hex");

        // 4. Verify payment
        const resVerify = await request(app)
            .post(`/bookings/${booking._id}/verify-payment`)
            .set("Cookie", guestCookie)
            .type("form")
            .send({
                razorpay_payment_id,
                razorpay_order_id,
                razorpay_signature
            });

        expect(resVerify.status).toBe(302); // redirects to my bookings on success

        // 5. Assert booking status updated to confirmed and paymentId saved
        const updatedBooking = await Booking.findById(booking._id);
        expect(updatedBooking.status).toBe("confirmed");
        expect(updatedBooking.paymentId).toBe(razorpay_payment_id);
    });

    test("Cancelling a booking requires a cancellation reason", async () => {
        const guestUser = await User.findOne({ username: "guest" });

        const booking = new Booking({
            listing: listing._id,
            guest: guestUser._id,
            checkIn: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            checkOut: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
            totalPrice: 300,
            status: "pending"
        });
        await booking.save();

        // Attempt cancellation without cancellationReason
        const resNoReason = await request(app)
            .patch(`/bookings/${booking._id}/cancel`)
            .set("Cookie", guestCookie)
            .type("form")
            .send({});

        expect(resNoReason.status).toBe(302);

        // Booking status must remain unchanged (pending)
        const uncancelledBooking = await Booking.findById(booking._id);
        expect(uncancelledBooking.status).toBe("pending");
        expect(uncancelledBooking.cancellationReason).toBeNull();
    });

    test("Cancelling a confirmed booking triggers Razorpay refund and saves refund details", async () => {
        const guestUser = await User.findOne({ username: "guest" });

        const booking = new Booking({
            listing: listing._id,
            guest: guestUser._id,
            checkIn: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            checkOut: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
            totalPrice: 300,
            status: "confirmed",
            paymentId: "pay_confirmed_12345"
        });
        await booking.save();

        const resCancel = await request(app)
            .patch(`/bookings/${booking._id}/cancel`)
            .set("Cookie", guestCookie)
            .type("form")
            .send({
                cancellationReason: "Emergency schedule change, unable to travel"
            });

        expect(resCancel.status).toBe(302);

        const cancelledBooking = await Booking.findById(booking._id);
        expect(cancelledBooking.status).toBe("cancelled");
        expect(cancelledBooking.cancellationReason).toBe("Emergency schedule change, unable to travel");
        expect(cancelledBooking.refundId).toBe("rfnd_test_987654");
        expect(cancelledBooking.refundStatus).toBe("processed");
        expect(cancelledBooking.refundAmount).toBe(300);
        expect(cancelledBooking.cancelledBy.toString()).toBe(guestUser._id.toString());
        expect(cancelledBooking.cancelledAt).toBeTruthy();
    });

    test("Cancelling an unpaid pending booking records reason with no refund", async () => {
        const guestUser = await User.findOne({ username: "guest" });

        const booking = new Booking({
            listing: listing._id,
            guest: guestUser._id,
            checkIn: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            checkOut: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
            totalPrice: 300,
            status: "pending",
            paymentId: null
        });
        await booking.save();

        const resCancel = await request(app)
            .patch(`/bookings/${booking._id}/cancel`)
            .set("Cookie", guestCookie)
            .type("form")
            .send({
                cancellationReason: "Decided to book another property instead"
            });

        expect(resCancel.status).toBe(302);

        const cancelledBooking = await Booking.findById(booking._id);
        expect(cancelledBooking.status).toBe("cancelled");
        expect(cancelledBooking.cancellationReason).toBe("Decided to book another property instead");
        expect(cancelledBooking.refundStatus).toBe("not_applicable");
        expect(cancelledBooking.refundId).toBeNull();
    });
});
