"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupOldMessages = exports.getUserProfile = exports.postChatMessage = exports.registerUsername = exports.verifySignature = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const ethers_1 = require("ethers");
admin.initializeApp();
const db = admin.firestore();
const rtdb = admin.database();
/**
 * Parse SIWE message to extract address
 */
function parseSiweMessage(message) {
    try {
        // Simple SIWE message parser
        const addressMatch = message.match(/0x[a-fA-F0-9]{40}/);
        const nonceMatch = message.match(/Nonce: ([a-zA-Z0-9]+)/);
        const domainMatch = message.match(/^(.+) wants you to sign in/);
        if (!addressMatch)
            return null;
        return {
            address: addressMatch[0],
            nonce: nonceMatch ? nonceMatch[1] : '',
            domain: domainMatch ? domainMatch[1] : '',
        };
    }
    catch {
        return null;
    }
}
/**
 * Verify SIWE (Sign-In with Ethereum) signature and create/get Firebase auth token
 */
exports.verifySignature = functions.https.onCall(async (data, context) => {
    const { message, signature } = data;
    if (!message || !signature) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing message or signature');
    }
    try {
        // Recover the signer's address from the signature
        const recoveredAddress = ethers_1.ethers.utils.verifyMessage(message, signature);
        const parsedMessage = parseSiweMessage(message);
        if (!parsedMessage) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid SIWE message format');
        }
        // Verify the recovered address matches the one in the message
        if (recoveredAddress.toLowerCase() !== parsedMessage.address.toLowerCase()) {
            throw new functions.https.HttpsError('unauthenticated', 'Signature does not match address');
        }
        const address = recoveredAddress.toLowerCase();
        // Create or get Firebase custom token
        const customToken = await admin.auth().createCustomToken(address, {
            address: address,
        });
        // Check if user exists, if not create
        const userRef = db.collection('users').doc(address);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            await userRef.set({
                address: address,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                username: null,
            });
        }
        return {
            token: customToken,
            address: address,
            isNewUser: !userDoc.exists,
        };
    }
    catch (error) {
        console.error('SIWE verification error:', error);
        throw new functions.https.HttpsError('unauthenticated', 'Signature verification failed');
    }
});
/**
 * Register a unique username for the authenticated user
 */
exports.registerUsername = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }
    const { username } = data;
    const userId = context.auth.uid;
    // Validate username
    if (!username || typeof username !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid username');
    }
    // Username rules: 3-16 chars, alphanumeric and underscores only
    const usernameRegex = /^[a-zA-Z0-9_]{3,16}$/;
    if (!usernameRegex.test(username)) {
        throw new functions.https.HttpsError('invalid-argument', 'Username must be 3-16 characters, alphanumeric and underscores only');
    }
    const normalizedUsername = username.toLowerCase();
    try {
        // Use transaction to ensure atomicity
        await db.runTransaction(async (transaction) => {
            // Check if user already has a username
            const userRef = db.collection('users').doc(userId);
            const userDoc = await transaction.get(userRef);
            if (userDoc.exists && userDoc.data()?.username) {
                throw new functions.https.HttpsError('already-exists', 'You already have a username');
            }
            // Check if username is taken
            const usernameRef = db.collection('usernames').doc(normalizedUsername);
            const usernameDoc = await transaction.get(usernameRef);
            if (usernameDoc.exists) {
                throw new functions.https.HttpsError('already-exists', 'Username is already taken');
            }
            // Register username
            transaction.set(usernameRef, {
                userId: userId,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            // Update user profile
            transaction.update(userRef, {
                username: username,
                usernameNormalized: normalizedUsername,
            });
        });
        return { success: true, username };
    }
    catch (error) {
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        console.error('Username registration error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to register username');
    }
});
/**
 * Post a message to the trollbox chat with rate limiting
 */
exports.postChatMessage = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
    }
    const { text } = data;
    const userId = context.auth.uid;
    // Validate message
    if (!text || typeof text !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid message');
    }
    // Check length (280 chars max)
    if (text.length > 280) {
        throw new functions.https.HttpsError('invalid-argument', 'Message too long (max 280 characters)');
    }
    // Check ASCII only
    if (!/^[\x20-\x7E]*$/.test(text)) {
        throw new functions.https.HttpsError('invalid-argument', 'Only ASCII characters allowed');
    }
    // Rate limiting: 1 message per 30 seconds
    const rateLimitRef = rtdb.ref(`rateLimit/${userId}`);
    const rateLimitSnapshot = await rateLimitRef.get();
    if (rateLimitSnapshot.exists()) {
        const lastMessage = rateLimitSnapshot.val();
        const timeSinceLastMessage = Date.now() - lastMessage.timestamp;
        if (timeSinceLastMessage < 30000) {
            const waitTime = Math.ceil((30000 - timeSinceLastMessage) / 1000);
            throw new functions.https.HttpsError('resource-exhausted', `Please wait ${waitTime} seconds before posting again`);
        }
    }
    try {
        // Get user's username
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        const username = userData?.username || userId.slice(0, 8);
        // Post message
        const chatRef = rtdb.ref('chat');
        const newMessageRef = chatRef.push();
        await newMessageRef.set({
            text: text,
            userId: userId,
            username: username,
            timestamp: admin.database.ServerValue.TIMESTAMP,
        });
        // Update rate limit
        await rateLimitRef.set({
            timestamp: Date.now(),
        });
        return { success: true, messageId: newMessageRef.key };
    }
    catch (error) {
        console.error('Chat post error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to post message');
    }
});
/**
 * Get user profile by address
 */
exports.getUserProfile = functions.https.onCall(async (data) => {
    const { address } = data;
    if (!address || typeof address !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid address');
    }
    const normalizedAddress = address.toLowerCase();
    const userDoc = await db.collection('users').doc(normalizedAddress).get();
    if (!userDoc.exists) {
        return { exists: false };
    }
    const userData = userDoc.data();
    return {
        exists: true,
        address: normalizedAddress,
        username: userData?.username || null,
        createdAt: userData?.createdAt?.toDate()?.toISOString() || null,
    };
});
/**
 * Cleanup old chat messages (run daily via Cloud Scheduler)
 */
exports.cleanupOldMessages = functions.pubsub.schedule('0 0 * * *').onRun(async () => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const chatRef = rtdb.ref('chat');
    const oldMessages = await chatRef
        .orderByChild('timestamp')
        .endAt(oneDayAgo)
        .once('value');
    const updates = {};
    oldMessages.forEach((child) => {
        updates[child.key] = null;
    });
    if (Object.keys(updates).length > 0) {
        await chatRef.update(updates);
        console.log(`Cleaned up ${Object.keys(updates).length} old chat messages`);
    }
    return null;
});
//# sourceMappingURL=index.js.map