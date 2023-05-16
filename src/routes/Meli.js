const { Router } = require('express');
const router = Router();
const Authenticator = require('../functions/Authenticator');
const axios = require('axios');
const User = require('../models/User');

router.get('/unlink', authorizateML, (req, res) => {

    const username = req.username;

    User.findOneAndUpdate({ username: username }, {
        MLToken: null,
        MLUserID: null,
        MLRefreshToken: null
    }, (err) => {

        if (err) res.status(500).redirect('/tryagain?go=/');
        
        else res.status(200).redirect('/');

    });

});

router.get('/meli/sell/:id', authorizateML, async (req, res) => {

    const sellID = req.params.id;
    const auth = 'Bearer ' + req.MLToken;

    const sell = await getSell(sellID, auth);

    if (!sell.message) res.status(200).json(sell);
    
    else res.status(500).json({message: sell.message});

});

async function getSell(sellID, auth){

    let sellData = {
        buyer: {

        },
        seller: {

        }
    };

    //GET SELL BASIC INFO
    await axios.get('https://api.mercadolibre.com/orders/' + sellID, {
        headers: {
            Authorization: auth
        }
    })
    .then(response => {

        const sell = response.data;

        const id = sell.id;
        const price = sell.total_amount;

        const date = sell.date_created.substring(0, 10);
        const day = date.substring(8, 10);
        const month = date.substring(5, 7);
        const year = date.substring(0, 4);
        const stringDate = day + '/' + month + '/' + year;

        const articles = getSellItems(sell.order_items);
        
        const buyerName = sell.buyer.first_name + " " + sell.buyer.last_name;

        const buyerUser = sell.buyer.nickname;

        const sellerUser = sell.seller.nickname;

        sellData.id = id;
        sellData.date = stringDate;
        sellData.price = price;
        sellData.articles = articles;
        sellData.buyer.name = buyerName;
        sellData.buyer.user = buyerUser;
        sellData.seller.user = sellerUser;

    })
    .catch(error => {
        
        let message = 'Error';
        if (error.response) message = error.response.data.message;
        
        sellData.message = message;
        
    });

    //GET BILLING INFO FOR THE DOC NUMBER
    await axios.get('https://api.mercadolibre.com/orders/' + sellID + '/billing_info', {
        headers: {
            Authorization: auth
        }
    })
    .then(response => {

        const doc_number = response.data.billing_info.doc_number;

        sellData.buyer.doc_number = doc_number;

    })
    .catch(error => {

        let message = 'Error';
        if (error.response) message = error.response.data.message;
        
        sellData.message = message;

    });

    return sellData;

}

function getSellItems(articles){


    let articlesTitles = [];

    for (let i = -1; i++; i < articles.length) {

        const article = articles[i];

        const title = article.item.title;
        const amount = article.quantity;
        const sku = article.item.seller_sku;

        articlesTitles[i] = {
            title: title,
            amount: amount,
            sku: sku
        };

    }

    return articlesTitles;

}

router.get('/meli/savetoken', authorizate, (req, res) => {

    const username = req.username;
    const code = req.query.code;

    const headers = {
        'accept': 'application/json',
        'content-type': 'application/x-www-form-urlencoded'
    }

    const body = {
        grant_type: 'authorization_code',
        client_id: process.env.MELICLIENTID,
        client_secret: process.env.MELISECRET,
        code: code,
        redirect_uri: process.env.MELIREDIRECTURI
    }

    axios.post('https://api.mercadolibre.com/oauth/token', body, headers)
         .then(response => {

            const token = response.data.access_token;
            const user_id = response.data.user_id;
            const refresh_token = response.data.refresh_token;

            if (token != undefined && refresh_token != undefined && user_id != undefined) {
                
                User.findOneAndUpdate({ username: username }, {
                    MLToken: token,
                    MLUserID: user_id,
                    MLRefreshToken: refresh_token
                }, (err) => {

                    if (err) {
                        res.status(500).redirect('/tryagain?go=/');
                    }
                    else res.status(200).redirect('/');

                });

            } else res.status(500).redirect('/tryagain?go=/')

         })
         .catch(error => {
             res.status(500).redirect('/tryagain?go=/&msg=¡Necesitamos que nos otorgues los permisos para trabajar en tu cuenta!');
         });


});

router.get('/meli/refreshtoken', authorizateML, (req, res) => {

    const username = req.username;
    const refresh_token = req.MLRefreshToken;
    const go = req.query.go || '/';

    const header = {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    const body = {
        grant_type: 'refresh_token',
        client_id: process.env.MELICLIENTID,
        client_secret: process.env.MELISECRET,
        refresh_token: refresh_token
    }

    axios.post('https://api.mercadolibre.com/oauth/token', body, header)
         .then(response => {

            const token = response.data.access_token;
            const user_id = response.data.user_id;
            const refresh_token = response.data.refresh_token;

            if (token != undefined && refresh_token != undefined && user_id != undefined) {
                
                User.findOneAndUpdate({ username: username }, {
                    MLToken: token,
                    MLUserID: user_id,
                    MLRefreshToken: refresh_token
                }, (err) => {

                    if (err) {
                        res.status(500).redirect('/tryagain?go=/');
                    }
                    else res.status(200).redirect(go);

                });

            } else res.status(500).redirect('/tryagain?go=/')

         })
         .catch(error => {

             const message = error.response.data.error;

             if (message == 'invalid_grant') {

                User.findOneAndUpdate({ username: username }, {
                    MLToken: null,
                    MLUserID: null,
                    MLRefreshToken: null
                }, (err) => {

                    if (err) res.status(500).redirect('/tryagain?go=/meli');
                    
                    else res.status(200).redirect('/');

                });

             } else res.status(500).redirect('/tryagain?go=/');

         });

});

router.get('/meli', authorizateML, (req, res) => {

    if (req.MLToken != undefined) {

        res
        .render('ML', {
            MLToken: req.MLToken,
            MLUserID: req.MLUserID,
            username: req.username,
            stylesheets: ['ML']
        });

    } else res.status(500).redirect('/');

});

function authorizateML(req, res, next){

    const accessToken = req.cookies.authorization;

    Authenticator.validateToken(accessToken, username => {

        if (username != null) {

            Authenticator.getMLData(username, (MLToken, MLUserID, MLRefreshToken) => {

                if (MLToken != undefined && MLUserID != undefined) {

                    req.username = username;
                    req.MLToken = MLToken;
                    req.MLUserID = MLUserID;
                    req.MLRefreshToken = MLRefreshToken;

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