var admin = require("firebase-admin");

var serviceAccount = require("../gs-project-c586b-firebase-adminsdk-gqj44-dbbf0022b7.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;
