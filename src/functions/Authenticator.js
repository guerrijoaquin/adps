const User = require('../models/User');
const jwt = require('jsonwebtoken');

function isValid(username, password){

    let msg = '';

    if (username.length > 0 && password.length > 0) 

        if (username.length <= 20 && password.length <= 20)

            if (!username.includes(' ')) return {result: true};

            else msg = 'El usuario no puede tener espacios';

        else msg = 'El usuario y/o la contraseña no pueden tener más de 20 caracteres';

    else msg = "El usuario y/o la contraseña no pueden quedar vacios";

    return {result: false, msg: msg};

}

function generateAccessToken(user){

    const payload = {username: user.username, password: user.password};
    return jwt.sign(payload, process.env.SECRET, {expiresIn: "365d"});

}

function validateToken(token, callback){

    if (!token) callback();

    else {

        jwt.verify(token, process.env.SECRET, (err, user) => {

            if (err) return callback();
    
            else {

                const userData = {username: user.username, password: user.password};
                login(userData, (result) => {

                    if (result) return callback(user.username);
                    else return callback();

                });
                
            }
    
        });

    }

}

function getMLData(username, callback) {

    User.findOne({ username: username }, (err, user) => {

        if (err || !user) callback();

        else {

            const MLToken = user.MLToken;
            const MLUserID = user.MLUserID;
            const MLRefreshToken = user.MLRefreshToken;

            if (MLToken != undefined && MLUserID != undefined && MLRefreshToken != undefined) 
                callback(MLToken, MLUserID, MLRefreshToken);

            else callback();

        }

    });

}

function register(userData, callback) {

    const {username, password} = userData;

    const validation = isValid(username, password);

    if (validation.result) {

        const user = new User({username, password});

        user.save(err => {
    
            if (err) {
    
                if (err.code == 11000) callback(false, 'El usuario ya existe');

                else callback(false, 'Ocurrió un error');
                
            } else callback(true, 'Usuario registrado');
    
        });

    } else callback(false, validation.msg);

}

function login(userData, callback) {

    const {username, password} = userData;

    const validation = isValid(username, password);

    if (validation.result) {

        User.findOne({username}, (err, user) => {

            if (err) callback(false, 'Error de autenticación');
            
            else if (!user) callback(false, 'El usuario no existe'); 
            
            else {

                user.isCorrectPassword(password, (err, result) => {
    
                    if (err) callback(false, 'Error de autenticación');

                    else if (result) callback(true, 'Usuario autenticado correctamente');

                    else callback(false, 'Usuario y/o contraseña incorrectos');
                    
                });
            }
    
        });

    } else callback(false, validation.msg);

}

module.exports = {
    'register': register,
    'login': login,
    'generateAccessToken': generateAccessToken,
    'validateToken': validateToken,
    'getMLData': getMLData
};