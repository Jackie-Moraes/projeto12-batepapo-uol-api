import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db = null;

const promise = mongoClient.connect();

promise.then(() => {
    db = mongoClient.db("batepapo_uol")
})

app.listen(process.env.PORTA, () => console.log("Server running!")); 