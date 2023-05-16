const { Router } = require('express');
const router = Router();
const Authenticator = require('../functions/Authenticator');
const User = require('../models/User');

router.get('/signout', (req, res) => {

    res.clearCookie('authorization').status(200).redirect('/login');

});

router.get('/tryagain', (req, res) => {

    const go = req.query.go || '/';
    const msg = req.query.msg || 'Ocurrió un error, vuelva a intentarlo.';
    const btn = req.query.btn || 'Reintentar';

    res.render('tryagain', {
        go: go,
        msg: msg,
        btn: btn.toUpperCase(),
        username: req.username || '',
        stylesheets: ['tryagain']
    });

});

router.get('/', authorizateML, (req, res) => {

    const username = req.username;

    if (req.MLToken != undefined) {
        
        res.render('home', {
            linked: true,
            username: username,
            stylesheets: ['home']
        });

    } else {

        res.render('home', {
            linked: false,
            username: username,
            stylesheets: ['home']
        });

    }

});

function authorizateML(req, res, next){

    const accessToken = req.cookies.authorization;

    Authenticator.validateToken(accessToken, username => {

        if (username != null) {

            Authenticator.getMLData(username, (MLToken, MLUserID) => {

                if (MLToken != undefined && MLUserID != undefined) {

                    req.username = username;
                    req.MLToken = MLToken;
                    req.MLUserID = MLUserID;

                    next();

                } else {
                    
                    req.username = username;
                    next();
                
                };

            });
        } else res.clearCookie('authorization').status(500).redirect('/login');

    });

}

function authorizate(req, res, next){

    const accessToken = req.cookies.authorization;

    Authenticator.validateToken(accessToken, username => {

        if (username != null) {
            req.username = username;
            next();
        } else res.clearCookie('authorization').status(500).redirect('/login');

    });

}

module.exports = router;