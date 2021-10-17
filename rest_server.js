var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

//var bodyParser = require('body-parser');
var cors = require('cors');

const securityFilter = require('./security_filter');

var appartementsRouter = require('./routes/appartments');
var usersRouter = require('./routes/user');
var arrivalsRouter = require('./routes/arrivals');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');


var unless = function(path, middleware) {
  return function(req, res, next) {
      if (path === req.path) {
          return next();
      } else {
          return middleware(req, res, next);
      }
  };
};

// TODO cors only in develop
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(unless('/user/login', securityFilter.ensureAuthenticated))

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({extended: true}));

app.use('/user', usersRouter);
app.use('/apartment', appartementsRouter);
app.use('/arrival', arrivalsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
