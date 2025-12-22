const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
        },
        otp: {
            type: String,
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// TTL index - automatically delete documents after expiration
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for fast lookups
otpSchema.index({ userId: 1, isVerified: 1 });

module.exports = mongoose.model("OTP", otpSchema);
