const requiredEnvVars = [
    "SECRET",
    "MONGODB_ATLAS",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "MAP_TOKEN",
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_CALLBACK_URL"
];

function validateEnv() {
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        throw new Error(
            `Startup validation failed. The following required environment variables are missing:\n` +
            missingVars.map(v => ` - ${v}`).join("\n") +
            `\nPlease check your .env file or environment configuration.`
        );
    }
}

module.exports = validateEnv;
