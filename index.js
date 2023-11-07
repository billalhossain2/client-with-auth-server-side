const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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

    //get all category jobs
    app.get("/category-jobs", async(req, res)=>{
      try {
      const result = await postedJobsCollection.find().toArray();
      res.status(200).send(result);
      } catch (error) {
        res.status(500).json({error:true, messagge:"There was server side error"})
      }
    })

    //get single job by id
    app.get("/category-jobs/:jobId", async(req, res)=>{
      try {
      const {jobId} = req.params;
      const query = {_id:new ObjectId(jobId)};

      const result = await postedJobsCollection.find(query).toArray();
      res.status(200).send(result);
      } catch (error) {
        res.status(500).json({error:true, messagge:"There was server side error"})
      }
    })

    //Add a new job
    app.post("/addJob", async(req, res)=>{
      try {
        const newJob = req.body;
        const result = await postedJobsCollection.insertOne(newJob);
        res.status(200).send({success:true, message:"Adde a new job successfully"});
        } catch (error) {
          res.status(500).json({error:true, messagge:"There was server side error"})
        }
    })

    //Add a new bid
    app.post("/addBid", async(req, res)=>{
      try {
        const newBid = req.body;
        const result = await bidsCollection.insertOne(newBid);
        res.status(200).send({success:true, message:"Added a new bid successfully"});
        } catch (error) {
          res.status(500).json({error:true, messagge:"There was server side error"})
        }
    })

    //get all bids  by user email
    app.get("/bids/:email", async(req, res)=>{
      try {
      const {email} = req.params;
      console.log(email)
      const query = {bidderEmail:email};

      const result = await bidsCollection.find(query).toArray();
      res.status(200).send(result);
      } catch (error) {
        res.status(500).json({error:true, messagge:"There was server side error"})
      }
    })

    //Update a job with id
    app.put("/updateJob/:jobId", async(req, res)=>{
      try {
        const {jobId} = req.params;
        const updateJob = {
          $set:req.body
        }
        const options = {upsert:true};
        const filter = {_id:new ObjectId(jobId)};

        const result = await postedJobsCollection.updateOne(filter, updateJob, options);
        res.status(200).send({success:true, message:"Update Job Was Successful"});
        } catch (error) {
          res.status(500).json({error:true, messagge:"There was server side error"})
        }
    })

    //Delete a job with id
    app.delete("/deleteJob/:jobId", async(req, res)=>{
      try {
        const {jobId} = req.params;

        const query = {_id:new ObjectId(jobId)};

        const result = await postedJobsCollection.deleteOne(query);
        res.status(200).send({success:true, message:"Delete Job Was Successful"});
        } catch (error) {
          res.status(500).json({error:true, messagge:"There was server side error"})
        }
    })

    //get single job by email
    app.get("/getJobsByEmail/:email", async(req, res)=>{
      try {
      const {email} = req.params;
      const query = {email};

      const result = await postedJobsCollection.find(query).toArray();
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
