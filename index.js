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

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const commentsCollection = client.db('blog-pulse').collection('comments');

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
    // get all blogs
    app.get('/allblogs/:id', async(req, res) => {
        const currentItem = req?.params?.id;
        const findQuery = {_id: new ObjectId(currentItem)};
        const currentBlogResult = await allBlogsCollection.findOne(findQuery);
        res.send(currentBlogResult);
    })
    // search bolgs 
    app.get('/searchBlog', async(req, res) => {
        const searchVal = req.query.search;
        const searchResult = await allBlogsCollection.find({blogTitle: searchVal}).toArray();
        res.send(searchResult);
        console.log('search value is',searchVal);
    })
    // get recent posted blogs 
    app.get('/recentBlogs', async(req, res) => {
      const currentTime = req.query?.time;
      const getFeaturedBlogs = await allBlogsCollection.find({blogPostTime: {$lt : currentTime}}).sort({blogPostTime: -1}).skip(0).limit(6).toArray();
      res.send(getFeaturedBlogs);
    })
    // get post item comments
    app.get('/comments', async(req, res) => {
      const comment = req.query?.blog;
      const commentResult = await commentsCollection.find({blogId: comment}).toArray();
      res.send(commentResult);
      console.log(comment);
    })

    // post methods

    app.post('/addnewblog', async(req, res) => {
      const newBlog = req.body;
      const addResult = await allBlogsCollection.insertOne(newBlog);
      res.send(addResult)
    })
    // post a comment
    app.post('/comments', async(req, res) => {
      const comment = req.body;
      const commentResult = await commentsCollection.insertOne(comment);
      res.send(commentResult);
      console.log(comment);
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