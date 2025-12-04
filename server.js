require("dotenv").config();
const express = require("express");
const { MongoClient } = require("mongodb");
const path = require("path");

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname))); // Serve static files like index.html

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function main() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    app.post("/join-waitlist", async (req, res) => {
      const { email } = req.body;
      if (!email) {
        return res
          .status(400)
          .json({ success: false, message: "Email is required" });
      }

      try {
        const database = client.db("waitlist");
        const collection = database.collection("emails");
        await collection.insertOne({ email: email, joinedAt: new Date() });
        res.json({ success: true });
      } catch (e) {
        console.error("Error inserting email:", e);
        res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      }
    });

    // Start the server
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (e) {
    console.error("Error connecting to MongoDB:", e);
  }
}

main();

module.exports = app;
