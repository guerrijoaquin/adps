const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const cookieParser = require('cookie-parser');

// configs
require('dotenv').config({path: path.join(__dirname, '.env')});
app.set('port', process.env.PORT);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/static', express.static(path.join(__dirname, 'public')));

// middlewares
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser(process.env.SECRET));

// database connect
const mongoLocalUri = 'mongodb://127.0.0.1:27017/ADPS-database'
mongoose.connect(mongoLocalUri, err => {

    if (err) console.log(err);
    
    else console.log('DB Connected');
    

});


// routes
app.use(require('./routes/routes'));

app.listen(app.get('port'), () => {
    console.log('Server running on port', app.get('port'));
})