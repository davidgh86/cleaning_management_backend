// middleware.js
var jwt = require("jwt-simple");
var moment = require("moment");
var config = require("./config");

exports.ensureAuthenticated = function (req, res, next) {
  if (!req.headers.authorization) {
    return res
      .status(403)
      .send({ message: "Forbidden" });
  }

  var token = req.headers.authorization.split(" ")[1];
  var payload = jwt.decode(token, config.TOKEN_SECRET);

  if (payload.exp <= moment().unix()) {
    return res.status(401).send({ message: "token has expired" });
  }

  req.userData = {
      username: payload.username,
      role: payload.role
    }
  next();
};

exports.ensureIsAdmin = function (req, res, next) {
    if (!req.userData.role && role !== "admin"){
        return res.status(401).send({message: "Not authorized"})
    }
    next();
}