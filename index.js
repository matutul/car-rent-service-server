const express = require('express')
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const SSLCommerzPayment = require('sslcommerz-lts');
require('dotenv').config();
const port = 3030;
const { MongoClient } = require('mongodb');
const ObjectID = require('mongodb').ObjectId;
const uri = `mongodb+srv://admin001:${process.env.DB_PASS}@cluster0.8e42p.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

// app.use(express.json());
app.use(bodyParser.json());
app.use(cors());


const serviceAccount = require(process.env.SERVICE_ACCOUNT);

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
  const ordersCollection = client.db(process.env.DB_NAME).collection("orders");
  // perform actions on the collection object

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
  // Place orders in database
  app.post('/addOrder', (req, res) => {
    ordersCollection.insertOne(req.body)
      .then(result => {
        res.send(result.acknowledged);
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




// SSL commerce payment

const store_id = process.env.STORE_ID;
const store_passwd = process.env.STORE_PASSWORD;
const is_live = false; //true for live, false for sandbox

//sslcommerz init
app.use('/ssl-request', (req, res) => {
  let dataForPayment = req.body;
  // console.log(dataForPayment);
  
  const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
  sslcz.init(dataForPayment).then(apiResponse => {
    // Redirect the user to payment gateway
    let GatewayPageURL = apiResponse.GatewayPageURL
    res.redirect(GatewayPageURL)
    console.log('Redirecting to: ', GatewayPageURL)
  });
})

app.post('/success', (req, res) => {
  console.log(req.body)
  return res.status(200).json({ body: req.body });
})

app.post('/fail', (req, res) => {
  return res.status(400).json({ data: req.body });
})

app.post('/cancel', (req, res) => {
  return res.status(200).json({ data: req.body });
})

app.post('/ipn', (req, res) => {
  return res.status(200).json({ data: req.body });
})

app.listen(process.env.PORT || port)