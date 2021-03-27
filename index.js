const express = require('express');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const port = 4000;

const serviceAccount = require("./configs/burj-al-arab-res-firebase-adminsdk-99voz-1bee69e012.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const {DB_USER, DB_PASS, DB_PROJECT} = process.env;

const uri = `mongodb+srv://${DB_USER}:${DB_PASS}@cluster0.ernz8.mongodb.net/${DB_PROJECT}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
  const bookingCollection = client.db(DB_PROJECT).collection("bookings");
  
  app.post('/AddBooks', (req, res) => {
    bookingCollection.insertOne(req.body)
    .then(result => {
        res.send(result.insertedCount > 0);
    });
  });

  app.get('/bookings', (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer ')) {
        const idToken = bearer.split(' ')[1];
        admin.auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
            const tokenEmail = decodedToken.email;
            const email = req.query.email;
            if (tokenEmail === email) {
                bookingCollection.find({email})
                .toArray((err, documents) =>{
                    res.send(documents);
                });
            }
            else{
                res.status(401).send('Unauthorized Access');
            }
        })
        .catch((error) => {
            res.status(401).send('Unauthorized Access');
        });
    }
    else{
        res.status(401).send('Unauthorized Access');
    }
  });
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});