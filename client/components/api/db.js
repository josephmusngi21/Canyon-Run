const dotenv = require('dotenv');
const { MongoClient } = require("mongodb");

dotenv.config();

const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error("Error: MONGODB_URI environment variable is not set.");
    process.exit(1);
}

let client;

async function getRunCollection() {
    if (!client) {
        client = new MongoClient(uri);
        await client.connect();
    }
    const db = client.db('canyon_run');
    return db.collection('run');
}

module.exports = { getRunCollection };
