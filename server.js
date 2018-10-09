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
  password: '',
  port: 5432
});

const client = new Client({
  user: 'folio',
  host: 'localhost',
  database: 'portfolio',
  password: '',
  port: 5432
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
  // TODO: protect from sql injection
  // client.query(('SELECT id, password FROM lio.users WHERE username = \'' + req.body.username + '\''), (err, resp) => {
  client.query(('SELECT user_access(\'' + req.body.username + '\');'), (err, resp) => {
    if(err) { console.log(err); }
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
          res.json({ status: 200, title: 'Success', id: resp.rows[0].id });
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
// router.get('/users', function(req, res) {
//   console.log('GET /users');
//   // TODO: protect from sql injection
//   client.query('SELECT username, password FROM lio.users;', (err, resp) => {
//     if(err) {
//       console.log(err);
//     }
//     res.json(resp.rows);
//   });
// });

// /api/v1/post
// post a blog post
router.post('/post', function(req, res) {
  // res.json({ status: 200, title: '/post' });
  console.log('POST /post');
  console.log(req.body);
  // TODO: protect from sql injection
  client.query('INSERT INTO lio.posts(title, post, users_fk) ' +
              'values (\'' + req.body.title + '\', \'' + req.body.content + '\', \'' + req.body.id + '\');',
  (err, resp) => {
    if(err) { console.log(err); }
    if(resp.command == 'INSERT' && resp.rowCount == 1) {
      res.json({ status: 200, title: 'Post Successful' });
    } else {
      res.json({ status: 500, title: 'Internal Server Error' });
    }
  });
});

// /api/v1/posts
// get all posts
router.get('/posts', function(req, res) {
  console.log('GET /posts');
  // TODO: protect from sql injection
  client.query('SELECT title, post, to_char(createdt, \'MM/DD/YYYY\') as createdt FROM lio.posts ORDER BY createdt DESC;', (err, resp) => {
    if(err) { console.log(err); }
    if(resp.command == 'SELECT') {
      res.json({ status: 200, title: 'Success', data: resp.rows });
    } else if(resp.rowCount == 0) {
      res.json({ status: 404, title: 'No Posts Retrieved' });
    } else {
      res.json({ status: 500, title: 'Internal Server Error' });
    }
  });
});

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api/v1', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
