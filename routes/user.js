var express = require('express');
var router = express.Router();
var authService = require("../auth_service");

const users = {
    "user" : {
        password : "housekeeping",
        role : "user"
    },
    "admin" : {
        password : "adm_housekeeping",
        role : "admin"
    }
}

/* GET users listing. */
router.post('/login', function(req, res, next) {
    let username = req.body.username;
    let password = req.body.password;

    if (!users[username] || users[username].password !== password) {
        res.status(401).send({message: "Not valid credentials"})
    }else {
        res.status(200).send({ token : authService.createToken(username, users[username].role)})
    }
});