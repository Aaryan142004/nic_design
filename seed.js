const mongoose = require("mongoose");
const fs = require("fs");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB connected"));

const electionSchema = new mongoose.Schema({
  state: String,
  totalSeats: Number,
  party1: String,
  party1Seats: Number,
  party2: String,
  party2Seats: Number,
});
const Election = mongoose.model("Election", electionSchema, "electionnewdatas");

const data = JSON.parse(fs.readFileSync("./public/data/election-data.json", "utf8"));

Election.deleteMany({})
  .then(() => Election.insertMany(data))
  .then(() => {
    console.log("✅ Data inserted successfully");
    mongoose.disconnect();
  })
  .catch((err) => {
    console.error("❌ Error inserting data:", err);
    mongoose.disconnect();
  });
