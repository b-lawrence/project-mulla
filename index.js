'use strict';

require('./environment');
const express = require('express');
const app = express();
const path = require('path');
const config = require('./server/config')(process.env.NODE_ENV);
// const favicon = require('serve-favicon');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const routes = require('./server/routes');
const genTransactionPassword = require('./server/utils/genTransactionPassword');
const apiVersion = process.env.API_VERSION;


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Uncomment this for Morgan to intercept all Error instantiations
// For now, they churned out via a JSON response
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// not using express less
// app.use(require('less-middleware')(path.join(__dirname, 'server/public')));
app.use(express.static(path.join(__dirname, './server/public')));

// memory based session
app.use(session({
  secret: config.expressSessionKey,
  resave: false,
  saveUninitialized: true,
}));

// on payment transaction requests,
// generate and password to req object
app.use(`/api/v${apiVersion}/payment*`, genTransactionPassword);

// get an instance of the router for api routes
const apiRouter = express.Router;
app.use(`/api/v${apiVersion}`, routes(apiRouter()));

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.request = req.originalUrl;
  err.status = 404;
  next(err);
});

// error handlers
app.use((err, req, res) => {
  console.log('ERROR PASSING THROUGH', err.message);
  // get the error stack
  const stack = err.stack.split(/\n/)
    .map(error => error.replace(/\s{2,}/g, ' ').trim());

  // send out the error as json
  res.status(err.status || 500).json({
    api: err,
    url: req.originalUrl,
    error: err.message,
    stack,
  });
});

const server = app.listen(process.env.PORT || 3000, () => {
  console.log('Express server listening on %d, in %s' +
    ' mode', server.address().port, app.get('env'));
});

// expose app
exports.default = app;
