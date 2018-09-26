// packages
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const { Pool, Client } = require('pg');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

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
  client.query(('SELECT password FROM lio.users WHERE username = ' + req.body.username), (err, res) => {
    console.log(err, res);
  });
});

// /api/v1/users
// get all users
router.get('/users', function(req, res) {
  client.query('SELECT username FROM lio.users;', (err, resp) => {
    if(err) {
      console.log(err);
    }
    res.json(resp.rows);
  });
});

// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api/v1', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
