const admin = require("firebase-admin");
const { getApps, initializeApp, cert } = require("firebase-admin/app"); // Import getApps, initializeApp, and cert

if (getApps().length === 0) { // Check length using getApps()
    let serviceAccount;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        } catch (error) {
            console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT env variable:", error);
        }
    } else {
        try {
            // Local development fallback
            serviceAccount = require("./firebase-adminsdk.json");
        } catch (error) {
            console.error("Local firebase-adminsdk.json missing. Set FIREBASE_SERVICE_ACCOUNT env var or add the file locally.");
        }
    }

    if (serviceAccount) {
        initializeApp({
            credential: cert(serviceAccount),
        });
    } else {
        console.warn("Firebase Admin SDK failed to initialize: No credentials found.");
    }
}

module.exports = admin;
