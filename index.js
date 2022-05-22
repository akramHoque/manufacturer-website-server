const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello from assignment 12!')
})

app.listen(port, () => {
  console.log(`assignment-12 app listening on port ${port}`)
})