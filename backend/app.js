const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const sauces = require('./models/sauce');

require('dotenv').config()

const path = require('path')
const saucesRoutes = require('./routes/sauce')
const userRoutes = require('./routes/user');
const helmet = require("helmet");

mongoose.connect(process.env.MONGO_SECRET,
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');

  // res.setHeader('Cross-Origin-Resource-Policy', 'same-site')
  next();
});

app.use(bodyParser.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

app.use('/api/sauces', saucesRoutes);
app.use('/api/auth', userRoutes);
app.use('/images', express.static(path.join(__dirname, 'images')));

module.exports = app;