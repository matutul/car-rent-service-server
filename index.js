const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const SSLCommerzPayment = require('sslcommerz-lts');
require('dotenv').config();
const port = 8000;
const { MongoClient } = require('mongodb');
const ObjectID = require('mongodb').ObjectId;
const uri = `mongodb+srv://admin001:${process.env.DB_PASS}@cluster0.8e42p.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

// app.use(express.json());
app.use(bodyParser.json());
app.use(cors({
  origin: "*",
}));


const serviceAccount = require(process.env.SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});



app.get('/', (req, res) => {
  res.send('Hello World!')
})

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  // console.log("Database connection errors: ", err);

  const carsCollection = client.db(process.env.DB_NAME).collection("cars");
  const adminsCollection = client.db(process.env.DB_NAME).collection("admins");
  const ordersCollection = client.db(process.env.DB_NAME).collection("orders");
  const complainsCollection = client.db(process.env.DB_NAME).collection("complains");
  const reviewsCollection = client.db(process.env.DB_NAME).collection("reviews");
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
        // console.log(err);
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

  // retreive orders from database
  app.post('/allOrders', (req, res) => {
    // console.log(req.query.orderType);
    // console.log(req.body.email)
    let queryObject = {};
    if (req.query.orderType) {
      queryObject.orderStatus = req.query.orderType;
    }
    else {
      queryObject.$or = [{ orderStatus: "PENDING" }, { orderStatus: "PROCESSING" }];
    }

    if (req.body.email) {
      adminsCollection.find({ email: req.body.email })
        .toArray((err, admin) => {
          if (admin.length == 0) {
            queryObject = { ...queryObject, 'paymentAddress.email': req.body.email }
            // console.log(admin.length)
            // console.log(queryObject)
          }
          ordersCollection.find(queryObject)
            .toArray((err, orders) => {
              // console.log(queryObject)
              // console.log(err)
              err ? res.status(400).send(err.message) : res.status(200).send(orders);
            })
        })
    }
  })



  // update status of order
  app.post('/updateOrderStatus', (req, res) => {
    // console.log(req.body);
    const newOrderStatus = req.body.orderToUpdate;
    ordersCollection.updateOne(
      { _id: ObjectID(newOrderStatus.id) },
      { $set: { orderStatus: newOrderStatus.value } }
    )
      .then(result => {
        // console.log(result);
        res.send(result.acknowledged);
      })
  })

  // update status of order
  app.post('/updatePaymentStatus', (req, res) => {
    // console.log(req.body);
    const newPaymentStatus = req.body.orderToUpdate;
    ordersCollection.updateOne(
      { _id: ObjectID(newPaymentStatus.id) },
      { $set: { paymentStatus: newPaymentStatus.value } }
    )
      .then(result => {
        // console.log(result);
        res.send(result.acknowledged);
      })
  })


  // Make new complains from client
  app.post('/addComplain', (req, res) => {
    // console.log(req.body)
    complainsCollection.insertOne(req.body)
      .then(result => {
        res.send(result.acknowledged);
      })
  })
  // get active complain
  app.post('/complains', (req, res) => {
    let queryObject = {};
    if (req.query.category === 'active') {
      queryObject.$or = [{ status: "PENDING" }, { status: "UNDER REVIEW" }];
    }
    if (req.query.category === 'solved') {
      queryObject.status = 'SOLVED';
    }

    if (req.body.email) {
      adminsCollection.find({ email: req.body.email })
        .toArray((err, admin) => {
          if (admin.length == 0) {
            queryObject = { ...queryObject, email: req.body.email }
          }
          complainsCollection.find(queryObject)
            .toArray((err, complains) => {
              // console.log(queryObject)
              // console.log(err)
              err ? res.status(400).send(err.message) : res.status(200).send(complains);
            })
        })
    }
  })
  // update complain status
  app.post('/updateComplainStatus', (req, res) => {
    // console.log(req.body);
    const newOrderStatus = req.body.orderToUpdate;
    complainsCollection.updateOne(
      { _id: ObjectID(newOrderStatus.id) },
      { $set: { status: newOrderStatus.value } }
    )
      .then(result => {
        // console.log(result);
        res.send(result.acknowledged);
      })
  })

  // Add review
  app.post('/addReview', (req, res) => {
    reviewsCollection.insertOne(req.body)
      .then(result => {
        res.send(result.acknowledged);
      })
  })
  // Get review for client
  app.post('/review', (req, res) => {
    let queryObject = {};
    if (req.body.email) {
      adminsCollection.find({ email: req.body.email })
        .toArray((err, admin) => {
          if (admin.length == 0) {
            queryObject = { email: req.body.email }
          }
          reviewsCollection.find(queryObject)
            .toArray((err, review) => {
              err ? res.status(400).send(err.message) : res.status(200).send(review);
            })
        })
    }
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


app.post('/ssl-request', (req, res) => {
  let dataForPayment = req.body;
  // console.log(dataForPayment);

  const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
  sslcz.init(dataForPayment).then(apiResponse => {
    // Redirect the user to payment gateway
    let GatewayPageURL = apiResponse.GatewayPageURL
    res.redirect(GatewayPageURL)
    // console.log('Redirecting to: ', GatewayPageURL)
  });
})

app.post('/success', (req, res) => {
  // console.log(req.body)
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