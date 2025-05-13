// Xata veritabanı istemcisi
require('dotenv').config();
const { XataClient } = require('@xata.io/client');

// XataClient yapılandırması
const xata = new XataClient({
  apiKey: process.env.XATA_API_KEY,
  branch: process.env.XATA_BRANCH || 'main',
  databaseURL: process.env.XATA_DATABASE_URL,
});

module.exports = xata;
