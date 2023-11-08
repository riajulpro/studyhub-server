const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://riajul-pro-authentication.web.app",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());

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
    const submittedData = client
      .db("assignmentDB")
      .collection("submittedAssignment");

    // JWT Token:
    app.post("/jwt", async (req, res) => {
      const payLoadData = req.body;
      const token = jwt.sign(payLoadData, process.env.SECRET, {
        expiresIn: "24h",
      });
      res
        .cookie("token", token, { httpOnly: true })
        .send({ msg: "Succeed", token });
    });

    // JWT Middleware
    const verify = async (req, res, next) => {
      const token = req.cookies?.token;
      if (!token) {
        return res.status(401).send({ status: "unAuthorized", code: "401" });
      }

      jwt.verify(token, process.env.SECRET, (error, decode) => {
        if (error) {
          res.status(401).send({ status: "unAuthorized", code: "401" });
        } else {
          req.decode = decode;
        }
      });

      next();
    };

    // Reading Data
    app.get("/", (req, res) => {
      res.send("Online Group Study Platform");
    });

    // GET: All the assignments
    app.get("/assignments", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const cursor = allAssignments
        .find()
        .skip(page * size)
        .limit(size);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/filter", async (req, res) => {
      const cursor = allAssignments.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // DELETE: Delete Specific Data
    app.delete("/assignments/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const result = await allAssignments.deleteOne(query);
      res.send(result);
    });

    app.delete("/submitted/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const result = await submittedData.deleteOne(query);
      res.send(result);
    });

    // GET: All the submitted data
    app.get("/submitted", verify, async (req, res) => {
      console.log(req.decode?.email);
      const cursor = submittedData.find();
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
    // PUT: Updating submitted data
    app.put("/submitted/:id", async (req, res) => {
      const filter = { _id: new ObjectId(req.params.id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: req.body,
      };
      const result = await submittedData.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    // POST: Creating a new assignment
    app.post("/assignment", async (req, res) => {
      const result = await allAssignments.insertOne(req.body);
      res.send(result);
    });

    // Count
    app.get("/documentCount", async (req, res) => {
      const count = await allAssignments.estimatedDocumentCount();
      res.send({ count });
    });

    // POST: Creating a submitted assignment data
    app.post("/submitted", async (req, res) => {
      const result = await submittedData.insertOne(req.body);
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
