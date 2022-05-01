import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import joi from "joi";
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
    const participant = req.body;

    const participantSchema = joi.object({
        name: joi.string().required()
    });

    const validation = participantSchema.validate(participant, {abortEarly: false});

    if (validation.error) {
        console.log("Tá dando ruim", validation.error.details);
    }

    try {
        await mongoClient.connect();
        const exists = await db.collection('participants').findOne({name: participant.name})

        if (exists) {
            return res.status(409).send("Esse nome já está em uso.");
        }
        if (typeof participant.name != "string" || !participant.name) {
            return res.status(422).send("O nome não pode estar vazio!");
        }
        

        await db.collection('participants').insertOne({name: participant.name, lastStatus: Date.now()});
        await db.collection('messages').insertOne({from: participant.name, to: 'Todos', text: 'entra na sala...', type: 'status', time: dayjs().format('HH:mm:ss')});
        res.sendStatus(201);
    } catch (e) {
        console.log("Erro!", e);
        res.status(500).send("Algo deu errado.", e);
    } finally {
        mongoClient.close();
    }
})

app.get('/messages', async (req, res) => {
    try {
        await mongoClient.connect();
        const user = req.headers.user;
        const limit = parseInt(req.query.limit);
        const messages = await db.collection('messages').find({}).toArray();

        const exists = await db.collection('participants').findOne({name: user});

        if (!exists) {
            console.log("Não existe este usuário", exists)
            return res.status(422).send("Este usuário não existe.");
        }

        let userMessages = [];
        for (let i = 0; i < messages.length; i++) {
            if (messages[i].to === user || messages[i].to === "Todos") {
                userMessages.push(messages[i]);
            }
        }
        
        if (limit) {
            let filteredMessages = [];
            for (let i = 0; i < limit; i++) {
                if (userMessages[i] != undefined) {
                    filteredMessages.push(userMessages[i]);
                }
            }
            return res.send(filteredMessages);
        }
        
        res.send(userMessages);
    } catch (e) {
        console.log("Erro!", e);
        res.status(500).send("Algo deu errado.", e);
    } finally {
        mongoClient.close();
    }
})

app.post('/messages', async (req, res) => {
    const message = req.body;

    const messageSchema = joi.object({
        to: joi.string().required(),
        text: joi.string().required(),
        type: joi.string().required()
    });

    const validation = messageSchema.validate(message, {abortEarly: false});

    if (validation.error) {
        console.log("Erro de validação", validation.error.details);
    }

    try {
        await mongoClient.connect();
        const from = req.headers.user;
        const {to, text, type} = req.body;

        const exists = await db.collection('participants').findOne({name: from});

        if (!exists) {
            console.log("Não existe este usuário", exists)
            return res.status(422).send("Este usuário não existe.");
        }

        if (type != "message" && type != "private_message") {
            console.log("Tipo inválido.")
            return res.status(422).send("Insira um tipo válido de mensagem.");
        }

        await db.collection('messages').insertOne({from: from, to: to, text: text, type: type, time: dayjs().format('HH:mm:ss')});
        res.status(201).send();
    } catch (e) {
        console.log("Erro!", e);
        res.status(500).send("Algo deu errado.", e);
    } finally {
        mongoClient.close();
    }
})

app.post('/status', async (req, res) => {
    try {
        await mongoClient.connect();
        const from = req.headers.user;

        const exists = await db.collection('participants').findOne({name: from});
        if (!exists) {
            console.log("Não existe este usuário", exists)
            return res.status(404).send("Este usuário não existe.");
        }

        const updateActive = await b.collection('participants').updateOne({
            name: from
        }, {$set: {lastStatus: Date.now()}});
        
        res.status(200).send();
    } catch {
        res.status(500).send(error)
    } finally {
        mongoClient.close();
    }
})

app.listen(process.env.PORTA, () => console.log("Server running!")); 