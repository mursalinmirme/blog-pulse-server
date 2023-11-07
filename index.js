const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;
require('dotenv').config();

// middleware
app.use(cors())
app.use(express.json())
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
    const categoryCollection = client.db('blog-pulse').collection('category');

    // get methods are

    // get categories 
    app.get('/categories', async(req, res) => {
        const getCategory = await categoryCollection.find().toArray();
        res.send(getCategory);
    })

    // get all blogs
    app.get('/allblogs', async(req, res) => {
        const filterBy = req?.query?.display;
        let filter = {};
        if(filterBy !== 'All'){
          filter = {category: filterBy}
        }
        console.log(filterBy);
        const getFilterBlogs = await allBlogsCollection.find(filter).toArray();
        res.send(getFilterBlogs);
    })
    // get recent posted blogs 
    app.get('/recentBlogs', async(req, res) => {
      const currentTime = req.query?.time;
      const getFeaturedBlogs = await allBlogsCollection.find({blogPostTime: {$lt : currentTime}}).sort({blogPostTime: -1}).skip(0).limit(6).toArray();
      res.send(getFeaturedBlogs);
    })
   

    app.post('/addnewblog', async(req, res) => {
      const newBlog = req.body;
      const addResult = await allBlogsCollection.insertOne(newBlog);
      res.send(addResult)
    })



    // Send a ping to confirm a successful connection
    client.db("admin").command({ ping: 1 });
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