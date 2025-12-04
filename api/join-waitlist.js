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
  if (cachedClient) {
    return cachedClient;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  return client;
}

/**
 * Main handler function for Vercel
 */
module.exports = async (req, res) => {
  // Only accept POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed. Use POST.",
    });
  }

  try {
    // Parse and validate the email from request body
    const { email } = req.body;

    if (!email || typeof email !== "string" || email.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Email is required and must be a non-empty string",
      });
    }

    // Basic email validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Connect to MongoDB and insert the email
    const client = await getMongoClient();
    const database = client.db("waitlist");
    const collection = database.collection("emails");

    // Insert the email with a timestamp
    const result = await collection.insertOne({
      email: email.toLowerCase(),
      joinedAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Email added to waitlist",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Error in join-waitlist API:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
