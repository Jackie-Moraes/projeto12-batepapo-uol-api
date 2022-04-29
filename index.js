import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import dayjs from "dayjs";
import 'dayjs/locale/pt-br.js'
import dotenv from 'dotenv';
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
promise.catch((e) => {
    console.log("Algo deu errado...", e)
})

app.get('/participants', async (req, res) => {
    try {
        await mongoClient.connect();
        const participants = await db.collection('participants').find({}).toArray();

        res.send(participants);
    } catch (e) {
        console.log("Erro!", e);
        res.status(500).send("Algo deu errado.", e);
    } finally {
        mongoClient.close();
    }
})

app.post('/participants', async (req, res) => {
    try {
        await mongoClient.connect();

        const participant = req.body.name;
        const exists = await db.collection('participants').findOne({name: participant})

        if (exists) {
            return res.status(409).send("Esse nome já está em uso.");
        }
        if (typeof participant != "string" || participant.length < 1) {
            return res.status(422).send("O nome não pode estar vazio!");
        }

        await db.collection('participants').insertOne({name: participant, lastStatus: Date.now()});
        // const now = dayjs().format('HH:mm:ss');
        await db.collection('messages').insertOne({from: participant, to: 'Todos', text: 'entra na sala...', type: 'status', time: dayjs().format('HH:mm:ss')});
        res.sendStatus(201);
    } catch (e) {
        console.log("Erro!", e);
        res.status(500).send("Algo deu errado.", e);
    } finally {
        mongoClient.close();
    }
})

app.listen(process.env.PORTA, () => console.log("Server running!")); 