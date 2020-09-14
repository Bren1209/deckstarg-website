require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

const app = express();
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: true}))
app.set('view engine', 'ejs')

mongoose.connect('mongodb://localhost:27017/deckstarUserDB', {useNewUrlParser: true, useUnifiedTopology: true})

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String
})

const secret = process.env.SECRET;
userSchema.plugin(encrypt, {secret: secret, encryptedFields: ['password']});

const User = new mongoose.model('User', userSchema)

app.get('/', (req, res) => {
    res.render('index');
})

app.get('/login', (req, res) => {
    res.render('login');
})

app.get('/signup', (req, res) => {
    res.render('signup');
})

app.post('/signup', function(req, res){
    const username = req.body.username
    const email = req.body.email
    const password = req.body.password

    const newUser = new User ({
        username: username,
        email: email,
        password: password
    });
    newUser.save(function(err){
        if(err){
            console.log(err);
        } else {
            res.render('login');
        }
    });
});

app.post('/login', function(req, res){
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({username: username}, function(err, foundUser){
        if(err) {
            console.log(err)
        } else {
            if(foundUser){
                if(foundUser.password === password) {
                    res.render('index')
                }
            }
        }
    })
})

app.listen(process.env.PORT || 8080, process.env.IP, () => {
    console.log('Server running')
})