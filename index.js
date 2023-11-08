const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cookieParser = require('cookie-parser')
const port = process.env.PORT || 5000;
require('dotenv').config();

// middleware
app.use(cors({
  origin: 'https://blog-pulse.vercel.app/',
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

const verifyToken = (req, res, next) => {
  const getToken = req.cookies.token;
  if(!getToken){
    return res.status(401).send({msg: 'Unauthorized'});
  }
  jwt.verify(getToken, process.env.SECRET_TOKEN, (err, decoded) => {
    if(err){
    return res.status(401).send({msg: 'Unauthorized access'});
    }
    req.user = decoded;
    next();
  })
}


// root ./
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
    const wishListCollection = client.db('blog-pulse').collection('wishList');

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
    // post a comment
    app.post('/wishlist', async(req, res) => {
      const wishlist = req.body;
      const wishlistResult = await wishListCollection.insertOne(wishlist);
      res.send(wishlistResult);
      console.log(wishlist);
    })

    // create a token
    app.post('/jwt', async(req, res) => {
      console.log('some one wants to make a token');
      const user = req.body;
      console.log('token create email:',user);
      const token = jwt.sign(user, process.env.SECRET_TOKEN, {expiresIn: '1h'});
      res
      .cookie('token', token, {
        httpOnly: true,
        // secure: false,
        secure: true,
        // sameSite: 'none',
      })
      .send({success: true})
    })

    // romove token after user logout
    app.post('/logout', async(req, res) => {
       console.log('logout called');
       res.clearCookie('token',{maxAge: 0}).send({success: true})
    })

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
        const getFilterBlogs = await allBlogsCollection.find(filter).sort({blogPostTime: -1}).toArray();
        res.send(getFilterBlogs);
    })
    // get all blogs
    app.get('/allblogs/:id', verifyToken, async(req, res) => {
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
    // get update blog 
    app.get('/update-blog', verifyToken, async(req, res) => {
      const updateBlogId = req.query.blogid;
      console.log(updateBlogId);
      const getUpdateBlog = await allBlogsCollection.findOne({_id: new ObjectId(updateBlogId)});
      res.send(getUpdateBlog);
    })
    // get my wishlist
    app.get('/wishlist', verifyToken, async(req, res) => {
      const tokenUser = req.user.email;
      console.log('mr token owner is:',tokenUser);
      const email = req.query?.email;
      if(tokenUser !== email){
        return res.status(403).send({msg: 'Forbidden'});
      }
      console.log('request owner is: ',email);
      const myWishList = await wishListCollection.find({owner: email}).toArray();
      res.send(myWishList);
    })
    // get top 10 featured blog
    app.get('/featured-blogs', async (req, res) => {
      const getFeaturedBlogs = await allBlogsCollection.aggregate([
        {
          $addFields: {
            fieldLength: { $strLenCP: "$longDescription" }
          }
        },
        {
          $sort: { fieldLength: -1 }
        }
      ]).skip(0).limit(10).toArray();
      res.send(getFeaturedBlogs);
    });







    
    // update a blog
    app.put('/update-blog/:id', async(req, res) => {
      const updateData = req.body;
      const updateId = req.params.id;
      const filter = {_id: new ObjectId(updateId)};
      const options = { upsert: true };
      const updateDoc = {
          $set : updateData,
      }
      const updateResult = await allBlogsCollection.updateOne(filter, updateDoc, options);
      res.send(updateResult);
      console.log('update data is ', updateData);
    })

    // delete a wishlist
    app.delete('/wishlist/:id', async(req, res) => {
      const deleteId = req.params.id;
      const deleteResult = await wishListCollection.deleteOne({_id: new ObjectId(deleteId)});
      res.send(deleteResult);
      console.log(deleteResult);
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