/**
 * Vercel Serverless Function for handling waitlist signups
 *
 * This is a Vercel Function (Node.js runtime) that:
 * - Accepts POST requests with JSON body { email: string }
 * - Validates the email field
 * - Connects to MongoDB using MONGODB_URI environment variable
 * - Inserts the email into the waitlist.emails collection
 * - Returns appropriate success/error responses
 *
 * Note: No app.listen() call or manual server setup needed.
 * MongoDB client is cached globally to avoid reconnection on each invocation.
 */

const { MongoClient } = require("mongodb");

// Global variable to store the cached MongoDB client
// This is cached at the function instance level to avoid reconnecting on every request
let cachedClient = null;

/**
 * Connect to MongoDB using the cached client pattern
 */
async function getMongoClient() {
  if (
    cachedClient &&
    cachedClient.topology &&
    cachedClient.topology.isConnected()
  ) {
    console.log("Using cached MongoDB client");
    return cachedClient;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  console.log("Creating new MongoDB client and connecting...");

  const client = new MongoClient(uri, {
    serverApi: {
      version: "1",
      strict: true,
      deprecationErrors: true,
    },
    maxPoolSize: 1,
    minPoolSize: 0,
    maxIdleTimeMS: 10000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });

  try {
    await client.connect();
    console.log("MongoDB connected successfully");
    cachedClient = client;
    return client;
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    throw new Error(`MongoDB connection failed: ${error.message}`);
  }
}

/**
 * Main handler function for Vercel
 */
module.exports = async (req, res) => {
  // Set response headers
  res.setHeader("Content-Type", "application/json");

  // Only accept POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed. Use POST.",
    });
  }

  try {
    console.log("Request body:", JSON.stringify(req.body));

    // Parse and validate the email from request body
    const { email } = req.body;

    if (!email || typeof email !== "string" || email.trim() === "") {
      console.log("Validation failed: email is empty or invalid type");
      return res.status(400).json({
        success: false,
        message: "Email is required and must be a non-empty string",
      });
    }

    // Basic email validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      console.log("Validation failed: invalid email format");
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    console.log("Attempting to connect to MongoDB...");

    // Connect to MongoDB and insert the email
    const client = await getMongoClient();
    console.log("Successfully connected to MongoDB");

    const database = client.db("waitlist");
    const collection = database.collection("emails");

    console.log("Inserting email into database:", email);

    // Insert the email with a timestamp
    const result = await collection.insertOne({
      email: email.toLowerCase(),
      joinedAt: new Date(),
    });

    console.log("Email inserted successfully:", result.insertedId);

    return res.status(200).json({
      success: true,
      message: "Email added to waitlist",
      insertedId: result.insertedId.toString(),
    });
  } catch (error) {
    console.error("Error in join-waitlist API:", error);
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message,
    });
  }
};
