// packages
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var keyword = require('./../keyword.json');
var config = require('./../db_config.json');
var fs = require('fs');
var cryptojs = require('crypto-js');

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
  user: config.user,
  host: config.host,
  database: config.database,
  password: config.password,
  port: config.port
});

const client = new Client({
  user: config.user,
  host: config.host,
  database: config.database,
  password: config.password,
  port: config.port
});
client.connect();

// ROUTES FOR API
var router = express.Router();

// /api/v1
// get index of api
router.get('/', function(req, res) {
  console.log('GET /');
  res.json({ message: 'hooray! welcome to our api!' });
});

// /api/v1/auth
// post attempt to authenticate
router.post('/auth', function(req, res) {
  console.log('POST /auth');
  // call sql plpgsql function
  client.query(('SELECT user_access(\'' + req.body.username + '\');'), (err, resp) => {
    if(err) { console.log(err); }

    if(resp.rowCount == 0) {
      res.json({ status: 404, title: 'Not Found' });
    } else {
      var user_access = resp.rows[0].user_access;

      bcrypt.compare(req.body.password, user_access.user_password, function(error, enc) {

        // if error from comparing
        if(error) {
          res.json({ status: 500, title: 'Internal Server Error' });
        }
        // if authorized
        if(enc) {
          res.json({ status: 200, title: 'Success', id: user_access.user_id });
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

// /api/v1/post
// post a blog post
router.post('/post', function(req, res) {
  // res.json({ status: 200, title: '/post' });
  console.log('POST /post');

  // authenticate the response so that a false 200 doesn't allow posts
  if(cryptojs.enc.Utf8.stringify(cryptojs.AES.decrypt(req.body.sign, keyword.keyword)) == keyword.message) {
    // call insert_post function
    client.query(('SELECT insert_post(\'' + req.body.title + '\', \'' + req.body.content + '\', ' + req.body.id + ');'),
    (err, resp) => {
      if(err) { console.log(err); }

      // check if insert function was run and returned a single row
      if(resp.command == 'SELECT' && resp.rowCount == 1) {
        res.json({ status: 200, title: 'Post Successful' });
      } else {
        res.json({ status: 500, title: 'Internal Server Error' });
      }
    });
  // if AES decryption fails
  } else {
    res.json({ status: 401, title: 'Unauthorized'});
  }
});

// /api/v1/posts
// get all posts
router.get('/posts', function(req, res) {
  console.log('GET /posts');
  // call function to retrieve posts
  client.query('SELECT get_posts();', (err, resp) => {
    if(err) { console.log(err); }

    // verify response
    if(resp.command == 'SELECT') {
      res.json({ status: 200, title: 'Success', data: resp.rows[0].get_posts });
    } else if(resp.rowCount == 0) {
      res.json({ status: 404, title: 'No Posts Retrieved' });
    } else {
      res.json({ status: 500, title: 'Internal Server Error' });
    }
  });
});

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api/v1
app.use('/api/v1', router);

app.use(function(req, res) {
  res.json({
    'name': 'Error',
    'status': 404,
    'message': 'Invalid Request',
    'statusCode': 404
  });
});

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
