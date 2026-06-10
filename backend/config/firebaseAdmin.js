const { initializeApp, cert } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");

const serviceAccount = require("./firebase-admin.json");

const app = initializeApp({
  credential: cert(serviceAccount),
});

module.exports = {
  app,
  getMessaging,
};