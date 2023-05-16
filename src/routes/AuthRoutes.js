const { Router } = require('express');
const router = Router();

const Authenticator = require('../functions/Authenticator');

router.get('/register', (req, res) => {

    const token = req.cookies.authorization;

    Authenticator.validateToken(token, username => {

        if (username) res.status(500).redirect('/');
            
        else 
        res.render('register', {
            stylesheets: ['login']
        });

    });

    

});

router.get('/login', (req, res) => {

    const registered = req.query.registered;
    const token = req.cookies.authorization;

    Authenticator.validateToken(token, username => {

        if (username) res.status(500).redirect('/');
            
        else 
        res.render('login', {
            registered: registered,
            stylesheets: ['login']
        });

    });

});

router.post('/register', (req, res) => {

    const userData = {username: req.body.username, password: req.body.password};

    Authenticator.register(userData, (result, msg) => {

        if (result) res.status(200).send(msg);

        else res.status(500).send(msg);

    });

});

router.post('/login', (req, res) => {

    const userData = {username: req.body.username, password: req.body.password};

    Authenticator.login(userData, (result, msg) => {

        const token = Authenticator.generateAccessToken(userData);

        if (result) res.cookie('authorization', token, {httpOnly: true}).status(200).send(msg);

        else res.status(500).send(msg);

    });

});

module.exports = router;