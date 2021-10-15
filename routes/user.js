var express = require('express');
var router = express.Router();
var authService = require("../auth_service");
const db = require("../mongoose_config")
const securityFilter = require('./../security_filter');


router.post('/login', function(req, res, next) {

    let inputUsername = req.body.username;
    let inputPassword = req.body.password;

    db.User.findOne( {'username' : inputUsername}, 'username password role' ).then(user => {
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

router.post('/register', securityFilter.ensureIsAdmin, function(req, res, next) {

    const userEntity = new db.User(req.body)
    
    userEntity.save().then((savedUser) => {
        
        res.status(201).send({ 
            token : authService.createToken(savedUser.username, savedUser.role),
            user: savedUser.username,
            role: savedUser.role
        })
    }).catch (() => {
        res.status(400).send({
            message : "Error creating user"
        })
    })
    
});

router.put('/:username', securityFilter.ensureIsAdmin, function(req, res, next) {

    const username = req.params.username

    let newData = req.body

    if (username !== req.body.username){
        res.status(400).send({
            message : "Not valid data"
        });
        return;
    }

    db.User.findOne( {'username' : username} ).then(user => {
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

router.delete('/:username', securityFilter.ensureIsAdmin, function(req, res, next) {

    const username = req.params.username

    db.User.findOneAndDelete( {'username' : username} ).then(user => {
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

    db.User.findOne( {'username' : username} ).then(user => {
        if (!user){
            res.status(404).send({message: "Not found"})
            return;
        }
        
        user.role = newData.role
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

router.get('', securityFilter.ensureIsAdmin, function(req, res, next) {

    let offset = req.query.offset
    let limit = req.query.limit
    
    db.User.paginate({}, { 
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

    db.User.findOne( {'username' : username} ).then(user => {
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

router.get('/:username', securityFilter.ensureIsAdmin, function(req, res, next) {

    const username = req.params.username

    db.User.findOne( {'username' : username} ).then(user => {
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