const { MongoClient } = require("mongodb");
require("dotenv").config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;
const uri = process.env.URI;

const databaseName = 'canyon_run';
const collectionName = 'runs';

if (!uri) {
    console.error("URI is not set.");
    process.exit(1);
}

// MongoDB Connection Function
async function main() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(databaseName);
        const collection = db.collection(collectionName);
        console.log("Connected to MongoDB:", db.databaseName);
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

async function listDatabases(client){
    databasesList = await client.db().admin().listDatabases();
    console.log("Databases:");
    databasesList.databases.forEach(db => console.log(` - ${db.name}`));
};

main().catch(console.error);

// Define the Run schema and model
const runSchema = new mongoose.Schema({
    name: String,
    latitude: Number,
    longitude: Number
});

const Run = mongoose.model('Run', runSchema);

// Express Middleware
app.use(express.json());
app.use(cors({
    origin: ["http://localhost:4000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));

// POST route to add a run
app.post('/add-run', async (req, res) => {
    const { name, latitude, longitude } = req.body;

    if (!name || !latitude || !longitude) {
        return res.status(400).send("Missing run details");
    }

    const run = new Run({
        name,
        latitude,
        longitude
    });

    try {
        await run.save();
        res.status(201).send("Run added successfully");
    } catch (err) {
        res.status(500).send("Error adding run: " + err.message);
    }
});

// Server Listening
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

// Call MongoDB connection function
main();
