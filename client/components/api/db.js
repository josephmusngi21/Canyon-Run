const { MongoClient } = require('mongodb');

async function main() {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    await client.connect();
    console.log('Connected to MongoDB');

    await listDatabases(client);

    try {
        await client.connect();
        await listDatabases(client);
    } catch (e) {
        console.error(e);
    }   finally {
        await client.close();
    }
}

async function listDatabases(client) {
    databasesList = await client.db().admin().listDatabases();
    console.log('Databases:')
    databasesList.databases.forEach(db => {
        console.log(` - ${db.name}`);
    });
};

main().catch(console.error);