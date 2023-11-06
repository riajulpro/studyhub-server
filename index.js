const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Code from MongoDB
const uri = process.env.URI;

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

    // Database List
    const allAssignments = client
      .db("assignmentDB")
      .collection("allAssignments");

    // Reading Data
    app.get("/", (req, res) => {
      res.send("Online Group Study Platform");
    });
    // GET: All the assignments
    app.get("/assignments", async (req, res) => {
      const cursor = allAssignments.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // GET: Single Data according to id
    app.get("/assignment/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };

      const result = await allAssignments.find(query).toArray();

      res.send(result);
    });

    // PUT: Updating a single data
    app.put("/assignment/:id", async (req, res) => {
      const filter = { _id: new ObjectId(req.params.id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: req.body,
      };
      const result = await allAssignments.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    // POST: Creating a new assignment
    app.post("/assignment", async (req, res) => {
      const result = await allAssignments.insertOne(req.body);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Online Group Study app listening on port ${port}`);
});
