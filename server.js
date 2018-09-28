// packages
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var keyword = require('./../keyword.json');
var crypto = require('crypto');
var fs = require('fs');

const saltRounds = 6;
const { Pool, Client } = require('pg');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

var port = process.env.PORT || 8080;

// DATABASE STUFF
const pool = new Pool({
  user: 'folio',
  host: 'localhost',
  database: 'portfolio',
  password: 'kevlew10',
  port: 5432
});

const client = new Client({
  user: 'folio',
  host: 'localhost',
  database: 'portfolio',
  password: 'kevlew10',
  port: 5432
});
client.connect();

// ROUTES FOR OUR API
var router = express.Router();

// /api/v1
// index of api
router.get('/', function(req, res) {
  res.json({ message: 'hooray! welcome to our api!' });
});

// /api/v1/auth
// attempt to authenticate
router.post('/auth', function(req, res) {
  client.query(('SELECT password FROM lio.users WHERE username = \'' + req.body.username + '\''), (err, resp) => {
    console.log(resp);
    if(resp.rowCount == 0) {
      res.json({ status: 404, title: 'Not Found' });
    } else {
      bcrypt.compare(req.body.password, resp.rows[0].password, function(error, enc) {
        // authenticate the response so that a false 200 doesn't allow posts
        //var cipher = crypto.createHmac('sha256', keyword.keyword);

        // if error from comparing
        if(error) {
          res.json({ status: 500, title: 'Internal Server Error' });
        }
        // if authorized
        if(enc) {
          res.json({ status: 200, title: 'Success' });
        }
        // if not authorized
        else if(!enc) {
          res.json({ status: 401, title: 'Unauthorized' })
        }
        // if some other response
        else {
          res.json({ status: 500, title: 'Internal Server Error' })
        }
      });
    } // end else
  });
});

// /api/v1/users
// get all users
router.get('/users', function(req, res) {
  client.query('SELECT username, password FROM lio.users;', (err, resp) => {
    if(err) {
      console.log(err);
    }
    res.json(resp.rows);
  });
});

// /api/v1/post
router.post('/post', function(req, res) {
  res.json({ status: 200, title: '/post' });
});

// /api/v1/posts

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api/v1', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
