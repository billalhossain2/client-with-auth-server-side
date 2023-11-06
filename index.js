const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion } = require('mongodb');
const dotenv = require("dotenv");

const app = express();
const port = process.env.PORT || 9000;

//Middlewares
app.use(cors({
  origin:["http://localhost:5173"],
  credentials:true
}));
app.use(express.json());
app.use(cookieParser());
dotenv.config();

//default route
app.get("/", (req, res) => {
  res.send(`Job Fusion server is running on port ${port}`);
});



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0ak1okw.mongodb.net/?retryWrites=true&w=majority`;

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
    await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // collections 
    const bidsCollection = client.db('jboFusionDB').collection('bids')
    const postedJobsCollection = client.db('jboFusionDB').collection('postedJobs')

    app.get("/category-jobs", async(req, res)=>{
      try {
      const result = await postedJobsCollection.find().toArray();
      res.status(200).send(result);
      } catch (error) {
        res.status(500).json({error:true, messagge:"There was server side error"})
      }
    })

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Job Fusion server is listening at port ${port}`);
});
