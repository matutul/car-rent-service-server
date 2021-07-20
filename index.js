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

console.log(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  console.log("Database connection errors: ", err);
  
  const carsCollection = client.db(process.env.DB_NAME).collection("cars");
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

});


app.listen(process.env.PORT || port)