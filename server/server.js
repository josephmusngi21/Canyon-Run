const { MongoClient } = require("mongodb");
require('dotenv').config();

async function main() {
  const uri = process.env.URI;
  if (!uri) {
    console.error("URI is not set.");
    process.exit(1);
  }
  const client = new MongoClient(uri);
  await client.connect();
  console.log("Connected to MongoDB");
};

main().catch(console.error);
