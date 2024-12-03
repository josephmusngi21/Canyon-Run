const { MongoClient } = require("mongodb");
require("dotenv").config();

async function main() {
  const uri = process.env.URI;
  const databaseName = 'canyon_run';
  const collectionName = 'runs';
  if (!uri) {
    console.error("URI is not set.");
    process.exit(1);
  }
  const client = new MongoClient(uri);
  try {
    await client.connect();
    // This will display all the databases
    // await listDatabases(client);
    const db = client.db(databaseName);
    const collection = db.collection(collectionName);
  } catch (e) {
    console.error(e);
  }finally {
    await client.close();
}
}

async function listDatabases(client){
    databasesList = await client.db().admin().listDatabases();
 
    console.log("Databases:");
    databasesList.databases.forEach(db => console.log(` - ${db.name}`));
};
 

main().catch(console.error);


//Login 
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const PORT = 3000;


function login() {
    const uri = process.env.URI;

    mongoose.connect(uri, 
        {useNewUrlParser: true,
            useUnifiedTopology: true,
        }).then(() => console.log("MongoDb is Connected Successfully")).catch((err) => console.log(err));


    app.listen(PORT, () => {
        console.log(`Server is listening on port ${PORT}`);
    });

    app.use(
        cors({
          origin: ["http://localhost:4000"],
          methods: ["GET", "POST", "PUT", "DELETE"],
          credentials: true,
        })
    );
};

app.use(express.json());