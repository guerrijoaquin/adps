const mongoose = require('mongoose');
const Schema = require('mongoose').Schema;
const bcrypt = require('bcrypt');

const saltRounds = 10;

const UserSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    MLToken: {
        type: String
    },
    MLUserID: {
        type: String
    },
    MLRefreshToken: {
        type: String
    }
}, {
    collation: {locale: 'en_US', caseLevel: true, strength: 2}
});

UserSchema.pre('save', function(next){

    if (this.isNew || this.isModified('password')) {

        const document = this;

        bcrypt.hash(document.password, saltRounds, (err, hashedPassword) => {
           
            if (err) {
                next(err);
            } else {
                document.password = hashedPassword;
                next();
            }

        });

    } else if (this.isModified('MLAccesToken')) {

        const document = this;

        bcrypt.hash(document.MLAccesToken, saltRounds, (err, hashedToken) => {
           
            if (err) {
                next(err);
            } else {
                document.MLAccesToken = hashedToken;
                next();
            }

        });

    } else next();

});

UserSchema.methods.isCorrectPassword = function(password, callback){

    bcrypt.compare(password, this.password, (err, same) => {

        if (err) {
            callback(err);
        } else {
            callback(err, same);
        }

    });

}

module.exports = mongoose.model('User', UserSchema);