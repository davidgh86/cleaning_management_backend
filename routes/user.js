var express = require('express');
var router = express.Router();
var authService = require("../auth_service");
const User = require("../mongoose_config").User;
const ensureIsAdmin = require('./../security_filter').ensureIsAdmin;


router.post('/login', function(req, res, next) {

    let auth = req.header('Authorization')
    if (!auth) {
        res.status(401).send({message: "Not valid credentials"})
        return
    }

    let inputUsername;
    let inputPassword;
    ({ inputUsername, inputPassword } = decodeBase64Credentials(auth));

    User.findOne( {'username' : inputUsername}, 'username password role' ).then(user => {
        if (!user || !user.username || !user.password || user.username !== inputUsername || user.password !== inputPassword) {
            res.status(401).send({message: "Not valid credentials"})
        } else {
            res.status(200).send({ 
                token : authService.createToken(user.username, user.role),
                user: user.username,
                role: user.role
            })
        }
    }).catch(() => {
        res.status(401).send({message: "Not valid credentials"})
    })
    
});

router.post('/register', ensureIsAdmin, function(req, res, next) {

    const userEntity = new User(req.body)
    
    userEntity.save().then((savedUser) => {
        
        res.status(201).send({ 
            user: savedUser.username,
            role: savedUser.role
        })
    }).catch (() => {
        res.status(400).send({
            message : "Error creating user"
        })
    })
    
});

router.put('/:username', ensureIsAdmin, function(req, res, next) {

    const username = req.params.username

    if (username === "root"){
        res.status(403).send({
            message: "Not authorized"
        })
        return;
    }

    let newData = req.body

    if (username !== req.body.username){
        res.status(400).send({
            message : "Not valid data"
        });
        return;
    }

    User.findOne( {'username' : username} ).then(user => {
        if (!user){
            res.status(404).send({message: "Not found"})
            return;
        }
        
        user.role = newData.role
        user.email = newData.email
        
        user.save().then((savedUser) => {
            res.status(200).send(savedUser)
        }).catch (() => {
            res.status(400).send({
                message : "Error creating user"
            })
        })
    }).catch(() => {
        res.status(400).send({
            message : "Error retrieving user"
        })
    })
});

router.delete('/:username', ensureIsAdmin, function(req, res, next) {

    const username = req.params.username

    if (username === "root"){
        res.status(403).send({
            message: "Not authorized"
        })
        return;
    }

    User.findOneAndDelete( {'username' : username} ).then(user => {
        if (!user){
            res.status(404).send({message: "Not found"})
            return;
        }
        res.status(200).send(user)
    }).catch(() => {
        res.status(400).send({
            message : "Error retrieving user"
        })
    })
});

router.put('/me', function(req, res, next) {

    const username = req.userData.username

    let newData = req.body

    if (username !== req.body.username){
        res.status(400).send({
            message : "Not valid data"
        });
        return;
    }

    User.findOne( {'username' : username} ).then(user => {
        if (!user){
            res.status(404).send({message: "Not found"})
            return;
        }

        user.email = newData.email
        user.password = newData.password
        
        user.save().then((savedUser) => {
            res.status(200).send(savedUser)
        }).catch (() => {
            res.status(400).send({
                message : "Error creating user"
            })
        })
    }).catch(() => {
        res.status(400).send({
            message : "Error retrieving user"
        })
    })
});

router.get('', ensureIsAdmin, function(req, res, next) {

    let offset = req.query.offset
    let limit = req.query.limit
    
    User.paginate({}, { 
        sort : { username: "asc"}, 
        offset: offset,
        limit: limit
    }).then((retrievedUsers) => {
        res.status(200).send(retrievedUsers)
    }).catch (() => {
        res.status(400).send({
            message : "Error retrieving users"
        })
    })
    
});

router.get('/me', function(req, res, next) {

    const username = req.userData.username

    User.findOne( {'username' : username} ).then(user => {
        if (!!user){
            res.status(200).send(user)
        } else {
            res.status(404).send({message: "Not Found"})
        }
    }).catch(() => {
        res.status(400).send({
            message : "Error retrieving user"
        })
    })
    
});

router.get('/:username', ensureIsAdmin, function(req, res, next) {

    const username = req.params.username

    User.findOne( {'username' : username} ).then(user => {
        if (!!user){
            res.status(200).send(user)
        } else {
            res.status(404).send({message: "Not Found"})
        }
    }).catch(() => {
        res.status(400).send({
            message : "Error retrieving user"
        })
    })
    
});


module.exports = router;

function decodeBase64Credentials(auth) {
    let credentials = Buffer.from(auth.split(" ")[1].trim(), 'base64');
    credentials = credentials.toString('utf8').split(":");

    let inputUsername = credentials[0];
    let inputPassword = credentials[1];
    return { inputUsername, inputPassword };
}
