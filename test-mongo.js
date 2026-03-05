import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = "mongodb+srv://admin:Fares222@cluster0.z0qpkps.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ اتصلت بـ MongoDB بنجاح!");
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
