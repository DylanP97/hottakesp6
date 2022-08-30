const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
var passwordValidator = require('password-validator');


// Create a schema
var schema = new passwordValidator();

// Add properties to it
schema
.is().min(8)                                                // Minimum length 8
.is().max(100)                                              // Maximum length 100
.has().uppercase()                                          // Must have uppercase letters
.has().lowercase()                                          // Must have lowercase letters
.has().digits(1)                                            // Must have at least 1 digit
.has().symbols(1)                                           // Must have at least 1 symbol
.has().not().spaces()                                       // Should not have spaces
.has().not('password')                                      // Not include the following
.has().not('123')                                           // Not include the following
.has().not('{')                                             // Not include the following
.has().not('}')                                             // Not include the following
.has().not('=')                                             // Not include the following
.has().not("'");                                            // Not include the following

// examples
// console.log(schema.validate('aaaaa')) // return false
// console.log(schema.validate('password123!P')) // return false
// console.log(schema.validate('Legitttt55{')) // return false
// console.log(schema.validate('GoodPwd01!'))  // return true


// ajout regex
let emailRegExp = new RegExp('^[a-zA-Z0-9.-_]+[@]{1}[a-zA-Z0-9.-_]+[.]{1}[a-z]{2,10}$');

exports.signup = (req, res, next) => {
    if (emailRegExp.test(req.body.email)) {
        if (schema.validate(req.body.password) == true) {
            bcrypt.hash(req.body.password, 10)
            .then(hash => {
                const user = new User({
                    email: req.body.email,
                    password: hash
                });
                user.save()
                .then(() => res.status(201).json({ message: 'Utilisateur créé !'}))
                .catch(error => res.status(400).json({error}))
            })
            .catch(error => res.status(500).json({error}))
        } else {
            res.status(401).json({message: 'Mot de passe pas conforme'}) 
        }
    } else {
        res.status(401).json({message: 'Email non conforme'}) 
    }

};


exports.login = (req, res, next) => {
    if (emailRegExp.test(req.body.email)) {
        if (schema.validate(req.body.password) == true) {
            User.findOne({email: req.body.email})
            // est-ce qu'il a bien trouvé un utilisateur
            .then(user => {
                if (user === null){
                    res.status(401).json({message: "Paire email/mot de passe incorrecte"})
                } else {
                    bcrypt.compare(req.body.password, user.password)
                    .then(valid => {
                        if (!valid) {
                            res.status(401).json({message: 'Paire email/mot de passe incorrecte'})
                        } else {
                            res.status(200).json({
                                userId: user._id,
                                token: jwt.sign(
                                    { userId: user._id},
                                    'RANDOM_TOKEN_SECRET',
                                    { expiresIn: '24h'}
                                )
                            });
                        }
                    })
                    .catch(error => {
                        res.status(500).json({error})
                    })
                }
            })
            .catch(error => {
                res.status(500).json({error});
            })
        } else {
            res.status(401).json({message: 'Mot de passe pas conforme'}) 
        }
    } else {
        res.status(401).json({message: 'Email non conforme'}) 
    }
};