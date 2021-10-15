// services.js
var jwt = require("jwt-simple");
var moment = require("moment");
var config = require("./config");

exports.createToken = function (username, role) {
  // TODO check if must send password
  var payload = {
    username: username,
    role: role,
    iat: moment().unix(),
    exp: moment().add(14, "days").unix(),
  };
  return jwt.encode(payload, config.TOKEN_SECRET);
};