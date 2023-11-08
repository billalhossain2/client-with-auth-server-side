const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 9000;

//Middlewares
app.use(
  cors({
    origin: ["https://jobfusiononline.web.app"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
dotenv.config();

// Custom Middleware 
const verifyJwtToken = (req, res, next)=>{
  const {token} = req?.cookies;
  if(!token){
    return res.status(401).send({error:true, message:"Unauthorized Access!"})
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded)=>{
    if(err){
      return res.status(403).send({error:true, message:"Fordden Access!"})
    }
    req.email = decoded.email;
    next()
  })
}

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
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // collections
    const bidsCollection = client.db("jboFusionDB").collection("bids");
    const postedJobsCollection = client
      .db("jboFusionDB")
      .collection("postedJobs");

    /*================== JWT Route ========================*/
    app.post("/set-cookie", (req, res) => {
      try {
        const user = req.body;
      const token = jwt.sign(user, process.env.JWT_SECRET_KEY, {
        expiresIn: '1h',
      });

      const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" ? true : false,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        path: "/",
      };

      res.cookie("token", token, options);

      res.status(200).send({success:true, message:'cookie set'})
      } catch (error) {
        res.status(500).send({error:true, message:"There was server side error"})
      }
    });


    app.post("/clear-cookie", (req, res)=>{
      try {

        const options = {
          maxAge:0,
          httpOnly: false,
          secure: process.env.NODE_ENV === "production" ? true : false,
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          path: "/",
        };

        res.cookie('token', '', options)
        res.send({success:true, message:'Cookie cleared'})
      } catch (error) {
        console.log('Cookie clearing error', error)
        res.status(500).send({error:true, message:"There was server side error"})
      }
    })

    //get all category jobs
    app.get("/category-jobs", async (req, res) => {
      try {
        const result = await postedJobsCollection.find().toArray();
        res.status(200).send(result);
      } catch (error) {
        res
          .status(500)
          .json({ error: true, messagge: "There was server side error" });
      }
    });

    //get single job by id
    app.get("/category-jobs/:jobId",verifyJwtToken, async (req, res) => {
      //================>>>>>>>Protected Route
      try {
        const { jobId } = req.params;
        const query = { _id: new ObjectId(jobId) };

        const result = await postedJobsCollection.find(query).toArray();
        res.status(200).send(result);
      } catch (error) {
        res
          .status(500)
          .json({ error: true, messagge: "There was server side error" });
      }
    });

    //Add a new job
    app.post("/addJob",verifyJwtToken, async (req, res) => {
      //================>>>>>>>Protected Route
      try {
        const newJob = req.body;
        const result = await postedJobsCollection.insertOne(newJob);
        res
          .status(200)
          .send({ success: true, message: "Adde a new job successfully" });
      } catch (error) {
        res
          .status(500)
          .json({ error: true, messagge: "There was server side error" });
      }
    });

    //Add a new bid
    app.post("/addBid",verifyJwtToken, async (req, res) => {
      //================>>>>>>>Protected Route
      try {
        const newBid = req.body;
        const result = await bidsCollection.insertOne(newBid);
        res
          .status(200)
          .send({ success: true, message: "Added a new bid successfully" });
      } catch (error) {
        res
          .status(500)
          .json({ error: true, messagge: "There was server side error" });
      }
    });

    //get all bids  by user email
    app.get("/bids",verifyJwtToken, async (req, res) => {
      //================>>>>>>>Protected Route
      try {
        const { email, sortTxt } = req.query;

        const result = await bidsCollection
          .find({ bidderEmail: email })
          .sort({ status: sortTxt === "ascending" ? 1 : -1 })
          .toArray();
        res.status(200).send(result);
      } catch (error) {
        res
          .status(500)
          .json({ error: true, messagge: "There was server side error" });
      }
    });

    //get all bids  by user email
    app.get("/bidRequests/:buyerEmail",verifyJwtToken, async (req, res) => {//================>>>>>>>Protected Route
      try {
        const { buyerEmail } = req.params;
        const query = { buyerEmail };

        const result = await bidsCollection.find(query).toArray();
        res.status(200).send(result);
      } catch (error) {
        res
          .status(500)
          .json({ error: true, messagge: "There was server side error" });
      }
    });

    //Update a job with id
    app.put("/updateJob/:jobId",verifyJwtToken, async (req, res) => {
      //================>>>>>>>Protected Route
      try {
        const { jobId } = req.params;
        const updateJob = {
          $set: req.body,
        };
        const options = { upsert: true };
        const filter = { _id: new ObjectId(jobId) };

        const result = await postedJobsCollection.updateOne(
          filter,
          updateJob,
          options
        );
        res
          .status(200)
          .send({ success: true, message: "Update Job Was Successful" });
      } catch (error) {
        res
          .status(500)
          .json({ error: true, messagge: "There was server side error" });
      }
    });

    //Update bid status
    app.patch("/bidStatus/:bidId",verifyJwtToken, async (req, res) => {
      //================>>>>>>>Protected Route
      try {
        const { bidId } = req.params;
        const updateJob = {
          $set: req.body,
        };
        const options = { upsert: false };
        const filter = { _id: new ObjectId(bidId) };

        const result = await bidsCollection.updateOne(
          filter,
          updateJob,
          options
        );
        res
          .status(200)
          .send({ success: true, message: "Status was changed successful" });
      } catch (error) {
        res
          .status(500)
          .json({ error: true, messagge: "There was server side error" });
      }
    });

    //Delete a job with id
    app.delete("/deleteJob/:jobId",verifyJwtToken, async (req, res) => {
      //================>>>>>>>Protected Route
      try {
        const { jobId } = req.params;

        const query = { _id: new ObjectId(jobId) };

        const result = await postedJobsCollection.deleteOne(query);
        res
          .status(200)
          .send({ success: true, message: "Delete Job Was Successful" });
      } catch (error) {
        res
          .status(500)
          .json({ error: true, messagge: "There was server side error" });
      }
    });

    //get single job by email
    app.get("/getJobsByEmail/:email",verifyJwtToken, async (req, res) => {
      //================>>>>>>>Protected Route
      try {
        const { email } = req.params;
        const query = { email };

        const result = await postedJobsCollection.find(query).toArray();
        res.status(200).send(result);
      } catch (error) {
        res
          .status(500)
          .json({ error: true, messagge: "There was server side error" });
      }
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Job Fusion server is listening at port ${port}`);
});
