//set environment
if (process.env.NODE_ENV !== 'production') {
  //setup dotenv library to access .env
  require('dotenv').config();
}

//declare stripe keys
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY;
const stripePrivateKey = process.env.STRIPE_PRIVATE_KEY;
// console.log(stripeSecretKey, stripeSecretKey2);

//setup modules
const express = require('express');
const fs = require('fs');
const stripe = require('stripe')(stripePrivateKey);

//initailise app
const app = express();

//setup server template engine and path
app.set('view engine', 'ejs');
app.use(express.static('public'));

//add middleware
app.use(express.json());

//setup routes
app.get('/store', function(req, res) {
  //setup items.json as a readable file
  fs.readFile('items.json', function(error, data) {
    if (error) {
      //check for errors
      res.status(500).end();
    } else {
      //render file
      res.render('store.ejs', {
        stripePublicKey: stripePublicKey,
        items: JSON.parse(data)
      });
    }
  });
});

app.post('/purchase', function(req, res) {
  fs.readFile('items.json', function(error, data) {
    if (error) {
      //check for errors
      res.status(500).end();
    } else {
      const itemsJson = JSON.parse(data);
      const itemsArray = itemsJson.phone.concat(itemsJson.accessories);
      let total = 0;
      req.body.items.forEach(function(item) {
        const itemJson = itemsArray.find(function(i) {
          return (i.id = item.id);
        });
        total = total + itemJson.price * item.quantity;
      });

      stripe.charges
        .create({
          amount: total,
          source: req.body.stripeTokenId,
          currency: 'gbp'
        })
        .then(function() {
          console.log('Charge Successful');
          res.json({ message: 'Successfully purchased items' });
        })
        .catch(function() {
          console.log('Charge Failed');
          res.status(500).end();
        });
    }
  });
});

//start server on port 4000
const port = process.env.PORT || 4000;
app.listen(port);
