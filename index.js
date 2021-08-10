const express = require('express')
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
require('dotenv').config();
const port = 4000;
const { MongoClient } = require('mongodb');
const uri = `mongodb+srv://admin001:${process.env.DB_PASS}@cluster0.8e42p.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

app.use(express.json());
app.use(cors());


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
    adminsCollection.find({email: req.body.email})
    .toArray((err, admin) => {
      res.send(admin.length > 0);
    })
  })

});


app.listen(process.env.PORT || port)