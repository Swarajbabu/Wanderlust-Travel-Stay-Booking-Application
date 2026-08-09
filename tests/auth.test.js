const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const User = require("../modals/user");
const bcrypt = require("bcrypt");

jest.mock("passport-google-oauth20", () => {
    const mockStrategy = function(options, verify) {
        this.name = "google";
        this.verify = verify;
    };
    mockStrategy.prototype.authenticate = function(req, options) {
        let profile = {
            id: "google123",
            displayName: "Google User",
            emails: [{ value: "google_user@example.com" }]
        };
        if (req.headers["x-mock-profile"]) {
            profile = JSON.parse(req.headers["x-mock-profile"]);
        }
        
        this.verify(req, "accessToken", "refreshToken", profile, (err, user, info) => {
            if (err) return this.error(err);
            if (!user) return this.fail(info);
            this.success(user, info);
        });
    };
    return { Strategy: mockStrategy };
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

beforeEach(async () => {
    await User.deleteMany({});
});

describe("Auth Flow Tests", () => {
    test("Signup creates a user and logs them in", async () => {
        const res = await request(app)
            .post("/signup")
            .type("form")
            .send({
                username: "signupuser",
                email: "signup@example.com",
                password: "password123"
            });
            
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/login/otp/verify");

        // Verify user is created in database
        const user = await User.findOne({ username: "signupuser" });
        expect(user).toBeTruthy();
        expect(user.email).toBe("signup@example.com");
    });

    test("Login with wrong password fails", async () => {
        // Register user
        await request(app)
            .post("/signup")
            .type("form")
            .send({
                username: "loginuser",
                email: "login@example.com",
                password: "password123"
            });

        const res = await request(app)
            .post("/login")
            .type("form")
            .send({
                username: "loginuser",
                password: "wrongpassword"
            });

        // Redirects to failureRedirect (/login)
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/login");
    });

    test("Protected routes redirect to /login when not authenticated", async () => {
        const resNew = await request(app).get("/listings/new");
        expect(resNew.status).toBe(302);
        expect(resNew.headers.location).toBe("/login");

        const resCreate = await request(app).post("/listings");
        expect(resCreate.status).toBe(302);
        expect(resCreate.headers.location).toBe("/login");
    });

    test("Forgot password flow sets token and resets password successfully", async () => {
        // 1. Create a user
        const signupRes = await request(app)
            .post("/signup")
            .type("form")
            .send({
                username: "forgotuser",
                email: "forgot@example.com",
                password: "password123"
            });
        expect(signupRes.status).toBe(302);

        // 2. Request forgot password link
        const forgotRes = await request(app)
            .post("/forgot-password")
            .type("form")
            .send({ email: "forgot@example.com" });

        expect(forgotRes.status).toBe(302);
        expect(forgotRes.headers.location).toBe("/login");

        // Verify token is set in database
        const user = await User.findOne({ email: "forgot@example.com" });
        expect(user.resetPasswordToken).toBeTruthy();
        expect(user.resetPasswordExpires.getTime()).toBeGreaterThan(Date.now());

        // 3. Getting reset form with valid token succeeds (200)
        const getResetRes = await request(app)
            .get(`/reset-password/${user.resetPasswordToken}`);
        expect(getResetRes.status).toBe(200);

        // 4. Getting reset form with invalid token redirects to forgot page
        const getResetBad = await request(app)
            .get(`/reset-password/invalidtoken123`);
        expect(getResetBad.status).toBe(302);
        expect(getResetBad.headers.location).toBe("/forgot-password");

        // 5. Submit reset password request
        const postResetRes = await request(app)
            .post(`/reset-password/${user.resetPasswordToken}`)
            .type("form")
            .send({ password: "newpassword456" });

        expect(postResetRes.status).toBe(302);
        expect(postResetRes.headers.location).toBe("/login");

        // Verify user reset details are cleared and password is changed
        const updatedUser = await User.findOne({ email: "forgot@example.com" });
        expect(updatedUser.resetPasswordToken).toBeUndefined();
        expect(updatedUser.resetPasswordExpires).toBeUndefined();

        // Login with old password fails
        const loginOldRes = await request(app)
            .post("/login")
            .type("form")
            .send({ username: "forgotuser", password: "password123" });
        expect(loginOldRes.headers.location).toBe("/login");

        // Login with new password succeeds
        const loginNewRes = await request(app)
            .post("/login")
            .type("form")
            .send({ username: "forgotuser", password: "newpassword456" });
        expect(loginNewRes.headers.location).toBe("/listings");
    });

    test("Google OAuth signup creates a new passwordless user", async () => {
        const mockProfile = {
            id: "google_new_123",
            displayName: "New Google User",
            emails: [{ value: "google_new@example.com" }]
        };

        const res = await request(app)
            .get("/auth/google/callback")
            .set("x-mock-profile", JSON.stringify(mockProfile));

        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/listings");

        // Verify user exists in database
        const user = await User.findOne({ googleId: "google_new_123" });
        expect(user).toBeTruthy();
        expect(user.email).toBe("google_new@example.com");
        expect(user.authProvider).toBe("google");
        // Should not have a salt/hash password set (or at least password is not usable)
        expect(user.salt).toBeUndefined();
        expect(user.hash).toBeUndefined();
    });

    test("Google OAuth links existing local account to Google on email match", async () => {
        // 1. Signup a local user
        await request(app)
            .post("/signup")
            .type("form")
            .send({
                username: "localuser",
                email: "match@example.com",
                password: "localpassword"
            });

        // Verify local user exists
        const initialUser = await User.findOne({ email: "match@example.com" });
        expect(initialUser).toBeTruthy();
        expect(initialUser.googleId).toBeUndefined();
        expect(initialUser.authProvider).toBe("local");

        // 2. Perform Google OAuth login with same email
        const mockProfile = {
            id: "google_linked_123",
            displayName: "Linked Google User",
            emails: [{ value: "match@example.com" }]
        };

        const res = await request(app)
            .get("/auth/google/callback")
            .set("x-mock-profile", JSON.stringify(mockProfile));

        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/listings");

        // 3. Verify user has been linked in DB
        const linkedUser = await User.findOne({ email: "match@example.com" });
        expect(linkedUser).toBeTruthy();
        expect(linkedUser.googleId).toBe("google_linked_123");
        expect(linkedUser.authProvider).toBe("google");
    });
});

describe("OTP Authentication & Email Verification Tests", () => {
    test("Unverified user trying to create listings is redirected to verify page", async () => {
        // Sign up a user (emailVerified: false by default)
        const signupRes = await request(app)
            .post("/signup")
            .type("form")
            .send({
                username: "unverifieduser",
                email: "unverified@example.com",
                password: "password123"
            });
        const cookie = signupRes.headers["set-cookie"];

        // Try accessing /listings/new
        const resNew = await request(app)
            .get("/listings/new")
            .set("Cookie", cookie);

        expect(resNew.status).toBe(302);
        expect(resNew.headers.location).toBe("/login/otp/verify");
    });

    test("OTP request and verify flow succeeds", async () => {
        // Create user
        const user = new User({
            username: "otpuser",
            email: "otpuser@example.com",
            emailVerified: false
        });
        await user.save();

        // 1. Request OTP
        const reqOtp = await request(app)
            .post("/login/otp/request")
            .type("form")
            .send({ email: "otpuser@example.com" });

        expect(reqOtp.status).toBe(302);
        expect(reqOtp.headers.location).toBe("/login/otp/verify");

        // Retrieve saved user to get hashed OTP
        const dbUser = await User.findOne({ email: "otpuser@example.com" });
        expect(dbUser.otpHash).toBeTruthy();
        expect(dbUser.otpExpiresAt.getTime()).toBeGreaterThan(Date.now());

        // Manually set a known OTP hash on the user model in the test
        const salt = await bcrypt.genSalt(10);
        dbUser.otpHash = await bcrypt.hash("123456", salt);
        dbUser.otpExpiresAt = Date.now() + 600000;
        await dbUser.save();

        // 2. Verify OTP with correct code
        const verifyRes = await request(app)
            .post("/login/otp/verify")
            .type("form")
            .send({
                email: "otpuser@example.com",
                code: "123456"
            });

        expect(verifyRes.status).toBe(302);
        expect(verifyRes.headers.location).toBe("/listings");

        // Verify status is cleared and verified in DB
        const updatedUser = await User.findOne({ email: "otpuser@example.com" });
        expect(updatedUser.emailVerified).toBe(true);
        expect(updatedUser.otpHash).toBeUndefined();
        expect(updatedUser.otpExpiresAt).toBeUndefined();
    });
});
