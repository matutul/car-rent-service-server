const express = require('express')
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

require('dotenv').config();
const port = 4000;
const { MongoClient } = require('mongodb');
const ObjectID = require('mongodb').ObjectId;
const uri = `mongodb+srv://admin001:${process.env.DB_PASS}@cluster0.8e42p.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

app.use(express.json());
app.use(cors());


const serviceAccount = require("./molla-rent-a-car-firebase-adminsdk-sc5pw-d6fe7cd969.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});



app.get('/', (req, res) => {
  res.send('Hello World!')
})

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  console.log("Database connection errors: ", err);

  const carsCollection = client.db(process.env.DB_NAME).collection("cars");
  const adminsCollection = client.db(process.env.DB_NAME).collection("admins");
  // perform actions on the collection object
  console.log("Database is connected successfully");

  app.post('/addCar', (req, res) => {
    carsCollection.insertOne(req.body)
      .then(result => {
        res.send(result.acknowledged);
      })
  })

  app.get('/cars', (req, res) => {
    carsCollection.find()
      .toArray((err, cars) => {
        res.send(cars);
      })
  })

  app.get('/admins', (req, res) => {
    adminsCollection.find()
      .toArray((err, admins) => {
        res.send(admins);
      })
  })

  app.post('/addAdmin', (req, res) => {
    let alreadyAdded = false;
    adminsCollection.find({ email: req.body.email })
      .toArray((err, admin) => {
        console.log(err);
        if (admin) {
          alreadyAdded = true;
          res.send(admin);
        }
      })

    if (!alreadyAdded) {
      adminsCollection.insertOne(req.body)
        .then(result => {
          res.send(result.acknowledged);
        })
    }
  })

  app.post('/checkAdmin', (req, res) => {
    adminsCollection.find({ email: req.body.email })
      .toArray((err, admin) => {
        res.send(admin.length > 0);
      })
  })

  app.post('/deleteCar', (req, res) => {
    carsCollection.deleteOne({ _id: ObjectID(req.body.id) })
      .then(result => {
        res.send(result.deletedCount > 0);
      })
  })
  app.post('/deleteAdmin', (req, res) => {
    adminsCollection.deleteOne({ _id: ObjectID(req.body.id) })
      .then(result => {
        res.send(result.deletedCount > 0);
      })
  })
});


// firebase admin action
// checking user by session storage's token
app.get('/checkUsers', (req, res) => {
  const token = req.headers.authorization;
  const idToken = token?.split(' ')[1];
  if (idToken) {
    admin
      .auth()
      .verifyIdToken(idToken)
      .then((decodedToken) => {
        res.send(decodedToken);
      })
      .catch((error) => {
        res.send(error);
      });
  }
})

app.listen(process.env.PORT || port)