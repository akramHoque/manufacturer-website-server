const express = require('express');
const cors = require('cors');

const jwt = require('jsonwebtoken');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// app.use(cors());
const corsConfig = {
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
  app.use(cors(corsConfig))
  app.options("*", cors(corsConfig))
  app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept,authorization")
  next()
  })
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.awk0b.mongodb.net/?retryWrites=true&w=majority`;


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'Unathorized access' })
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {

    if (err) {
      return res.status(403).send({ message: 'Forbidden' })
    }
    req.decoded = decoded;
    next();
  })
}



async function run() {

  try {

    await client.connect()
    const toolCollection = client.db('manufacturing-tools').collection('tools');
    const orderCollection = client.db('manufacturing-tools').collection('orders');
    const allUserCollection = client.db('manufacturing-tools').collection('users');
    const productCollection = client.db('manufacturing-tools').collection('products');

    const verifyAdmin = async (req, res, next) => {
      const initiator = req.decoded.email;
      const initiatorAccoutFind = await allUserCollection.findOne({ email: initiator });
      if (initiatorAccoutFind.role === 'admin') {
        next();
      }
      else{
        res.status(403).send({ message: 'Forbidden' })
      }
    }
      // // load all tool
      // app.get('/tool', async (req, res) => {
      //   const query = {};
      //   const cursor = toolCollection.find(query).project({ name: 1 });
      //   const tools = await cursor.toArray();
      //   res.send(tools);

      // });
      app.get('/tool', async (req, res) => {
        const query = {};
        const cursor = toolCollection.find(query);
        const tools = await cursor.toArray();
        res.send(tools);

      });

      // post the add products
      app.post('/product',verifyJWT, verifyAdmin, async (req, res) => {
        const product = req.body;
        const result = await productCollection.insertOne(product);
        res.send(result);
      })


// load all product

  app.get('/product',verifyJWT, verifyAdmin, async (req, res) =>{
   const products = await productCollection.find().toArray();
  res.send(products);

})

// // delete product
app.delete('/product/:email',verifyJWT, verifyAdmin, async(req, res) =>{

  const email = req.params.email;
  const filter = {email: email};
  const result = await productCollection.deleteOne(filter);
  res.send(result);
 

})


      // load users

      app.get('/user', async (req, res) => {
        const users = await allUserCollection.find().toArray();
        res.send(users);
      })

      app.get('/admin/:email', async (req, res) => {
        const email = req.params.email;
        const user = await allUserCollection.findOne({ email: email });
        const isAdmin = user.role === 'admin';
        res.send({ admin: isAdmin })
      })


      app.put('/user/admin/:email', verifyJWT, verifyAdmin, async (req, res) => {
        const email = req.params.email;
          const filter = { email: email };
          const updatedDoc = {
            $set: { role: 'admin' },
          };
          const result = await allUserCollection.updateOne(filter, updatedDoc);

          res.send(result);
        

      })




      app.put('/user/:email', async (req, res) => {
        const email = req.params.email;
        const user = req.body;
        const filter = { email: email };
        const options = { upsert: true };
        const updatedDoc = {
          $set: user,
        };
        const result = await allUserCollection.updateOne(filter, updatedDoc, options);
        const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
        res.send({ result, token });
      })
      // post order data to db

      app.post('/order', async (req, res) => {
        const order = req.body;
        const result = await orderCollection.insertOne(order);
        res.send(result);

      })



      // get specipic order for payment

      app.get('/order/:id', verifyJWT, async(req, res) =>{
        const id = req.params.id ;
        const query = {_id: ObjectId(id)};
        const order = await orderCollection.findOne(query) ;
        res.send(order);
      })
      // get order from db

      app.get('/order', verifyJWT, async (req, res) => {
        const email = req.query.email;

        const decodedEmail = req.decoded.email;

        if (email === decodedEmail) {
          const query = { email: email };
          const orders = await orderCollection.find(query).toArray();
          return res.send(orders);
        }

        else {
          return res.status(403).send({ message: 'Forbidden access' });
        }

      })


      // load a specific tool
      app.get('/purchase/:id', async (req, res) => {
        const id = req.params.id;
        console.log(id);
        const query = { _id: ObjectId(id) };
        const item = await toolCollection.findOne(query);
        res.send(item);
      })

    }

  finally {

    }

  }

run().catch(console.dir);

// test 
  app.get('/', (req, res) => {
    res.send('Hello from assignment 12!')
  })

  app.get('/hero' , (req, res) => {
    res.send('Heo ku works')
  })

  app.listen(port, () => {
    console.log(`assignment-12 app listening on port ${port}`)
  })