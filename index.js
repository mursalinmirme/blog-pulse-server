const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();

app.get('/', (req, res) => {
    res.send('The blogpulse server is running....');
})


// mongo db

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@mursalin.bxh3q56.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    // collections
    const allBlogsCollection = client.db('blog-pulse').collection('allblogs');

    app.get('/allblogs', async(req, res) => {
        const getAllBlogs = await allBlogsCollection.find().toArray();
        res.send(getAllBlogs);
    })





    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);










app.listen(port, () => {
    console.log(`The current port ${port} is running.`);
})