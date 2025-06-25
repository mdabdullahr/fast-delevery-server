const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");



dotenv.config();

const stripe = require('stripe')(process.env.PAYMENT_GATEWAY_KEY);

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jsryxpo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const parcelCollection = client.db("parcelDB").collection("parcels");

    // get specific or all data api
    app.get("/parcels", async (req, res) => {
      try {
        const userEmail = req.query.email;
        const query = userEmail ? { created_by: userEmail } : {};
        const options = {
          sort: { createdAt: -1 },
        };
        const result = await parcelCollection.find(query, options).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching parcels:", error);
        res.status(500).send({ error: "Failed to fetch parcels" });
      }
    });

    // *get a parcel by Id
    // GET /api/parcels/:id

    app.get("/parcels/:id", async (req, res) => {
      const { id } = req.params;

      try {
        const parcel = await parcelCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!parcel) {
          return res.status(404).send({ message: "Parcel not found" });
        }

        res.send(parcel);
      } catch (error) {
        res
          .status(500)
          .send({ message: "Failed to fetch parcel", error: error.message });
      }
    });

    // Add Parcel Post req
    app.post("/parcels", async (req, res) => {
      try {
        const parcelData = req.body;
        const result = await parcelCollection.insertOne(parcelData);
        res.status(201).send(result);
      } catch (error) {
        console.error("Error inserting parcel:", error);
        res.status(500).send({ error: "Failed to create parcel" });
      }
    });

    app.delete("/parcels/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await parcelCollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.send(result);
      } catch (error) {
        console.error("Error inserting parcel:", error);
        res.status(500).send({ error: "Failed to create parcel" });
      }
    });

    app.post("/create-payment-intent", async (req, res) => {
      console.log(req.body);
      try {
        const amountInCents = req.body.amountInCents

        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: 'usd',
          payment_method_types: ["card"],
        });

        console.log("payment intent", paymentIntent);

        res.json({
          clientSecret: paymentIntent.client_secret,
        });
        console.log(clientSecret);
      } catch (error) {
        res.status(500).json({error: error.message})
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("🚚 Parcel Server is Running");
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
