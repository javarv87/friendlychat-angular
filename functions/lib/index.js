"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require('firebase-functions');
// Import and initialize the Firebase Admin SDK.
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
exports.helloWorld = functions.https.onRequest((request, response) => {
    response.send("Hello from Firebase!");
});
// Adds a message that welcomes new users into the chat.
exports.addWelcomeMessages = functions.auth
    .user()
    .onCreate((user) => {
    console.log('A new user signed in for the first time.');
    const fullName = user.displayName || 'Anonymous';
    // Saves the new welcome message into the database
    // which then displays it in the FriendlyChat clients.
    // Reference Firestore
    const db = admin.firestore();
    return db.collection('messages').add({
        name: 'Firebase Bot',
        photoUrl: 'https://storage.googleapis.com/st-angular-labs.appspot.com/firebase-logo.png',
        text: `${fullName} signed in for the first time! Welcome!`,
        createdAt: new Date()
    });
});
// functions.database.ref('/messages/{messageId}').onWrite((change, context) => {
// Sends a notifications to all users when a new message is posted.
exports.sendNotifications = functions.firestore
    .document('messages/{messageId}')
    .onWrite((change, context) => {
    // Only send a notification when a message has been created.
    if (change.before.data()) {
        return;
    }
    // Notification details.
    const original = change.after.data();
    const text = original.text;
    const payload = {
        notification: {
            title: `${original.name} postió ${text ? 'un mensaje' : 'una imagen'}`,
            body: text ? (text.length <= 100 ? text : text.substring(0, 97) + '...') : '',
            icon: original.photoUrl || 'https://storage.googleapis.com/st-angular-labs.appspot.com/firebase-logo.png',
            click_action: `https://st-angular-labs.firebaseapp.com/`
        }
    };
    // Get the list of device tokens.
    return admin.database().ref('fcmTokens').once('value').then(allTokens => {
        if (allTokens.val()) {
            // Listing all tokens.
            const tokens = Object.keys(allTokens.val());
            // Send notifications to all tokens.
            return admin.messaging().sendToDevice(tokens, payload).then(response => {
                // For each message check if there was an error.
                const tokensToRemove = [];
                response.results.forEach((result, index) => {
                    const error = result.error;
                    if (error) {
                        console.error('Failure sending notification to', tokens[index], error);
                        // Cleanup the tokens who are not registered anymore.
                        if (error.code === 'messaging/invalid-registration-token' ||
                            error.code === 'messaging/registration-token-not-registered') {
                            tokensToRemove.push(allTokens.ref.child(tokens[index]).remove());
                        }
                    }
                });
                return Promise.all(tokensToRemove);
            });
        }
    });
});
//# sourceMappingURL=index.js.map