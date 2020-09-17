require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose');
const today = new Date();
const date = today.getDate() + '-' + (Number(today.getMonth()) + 1).toString() + '-' + today.getFullYear() + ' at ' + today.getHours() + ':' + today.getMinutes()
// const back = require('express-back');
var passwordMatch = true;
var userExists = false;

const app = express();

app.use(express.static('public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

const sessionSecret = process.env.SESSION_SECRET

app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false
}));

// app.use(back())
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/deckstarUserDB', {useNewUrlParser: true, useUnifiedTopology: true})

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String
})

const commentSchema = new mongoose.Schema({
    forPost: String,
    date: String,
    text: String,
    author: {
        id: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
        username: String
    }
})

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model('User', userSchema)
const Comment = new mongoose.model('Comment', commentSchema)

// Comment.create({text: 'Test comment 3', author: 'testUser3'})

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/', (req, res) => {
    res.render('index', {currentUser: req.user});
})

app.get('/login', (req, res) => {
    res.render('login', {currentUser: req.user});
})

app.get('/signup', (req, res) => {
    res.render('signup', {currentUser: req.user, passwordMatch: passwordMatch, userExists: userExists});
})

app.post('/signup', function(req, res){
    const username = req.body.username
    const email = req.body.email
    const password = req.body.password
    const password2 = req.body.password2

    if(password != password2){
        console.log('Passwords do not match.')
        passwordMatch = false
        res.redirect('/signup')
    } else {
        User.register({
            username: username,
            email: email},
            password, function(err, user){
            if(err){
                console.log(err);
                userExists = true
                res.redirect('signup')
            } else {
                userExists = false
                passwordMatch = true
                passport.authenticate('local')(req, res, function(){
                    res.redirect('/')
                })
            }
        })
    }
});

app.post('/login', function(req, res){
    const username = req.body.username;
    const password = req.body.password;

    const user = new User({
        username: username,
        password: password
    });

    req.login(user, function(err){
        if(err){
            console.log(err);
        } else {
            passport.authenticate('local', {successRedirect: '/', failureRedirect: '/login'})(req, res, function(){
            })
        }
    })
})

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/')
})

app.get('/news/100-sub-giveaway', (req, res) => {
    Comment.find({forPost: '100-sub-giveaway'}, function(err, allComments){
        if(err){
            console.log(err)
        } else {
            var reversedComments = [];
            allComments.forEach(function(comment){
                reversedComments.push(comment)
            })
            reversedComments.reverse()
            res.render('news/100-sub-giveaway', {comments: reversedComments, currentUser: req.user})
        }
    })
})

app.get('/100-sub-giveaway/write', isLoggedIn, (req, res) => {
    res.render('comments/write-100-sub-giveaway', {currentUser: req.user})
})

app.post('/100-sub-giveaway/comments', isLoggedIn, (req, res) => {
    Comment.create({forPost: '100-sub-giveaway', text: req.body.text, author: req.user.username, date: date}, (err, comment) => {
        if(err){
            console.log(err)
            res.redirect('/')
        } else {
            comment.author.id = req.user._id;
            comment.author.username = req.user.username
            comment.save()
            res.redirect('/news/100-sub-giveaway')
        }
    })
})

app.get('/news/my-latest-release', (req, res) => {
    Comment.find({forPost: 'my-latest-release'}, function(err, allComments){
        if(err){
            console.log(err)
        } else {
            res.render('news/my-latest-release', {comments: allComments, currentUser: req.user})
        }
    })
})

app.get('/my-latest-release/write', isLoggedIn, (req, res) => {
    res.render('comments/write-my-latest-release', {currentUser: req.user})
})

app.post('/my-latest-release/comments', isLoggedIn, (req, res) => {
    Comment.create({forPost: 'my-latest-release', text: req.body.text, author: req.user.username, date: date}, (err, comment) => {
        if(err){
            console.log(err)
            res.redirect('/')
        } else {
            comment.author.id = req.user._id;
            comment.author.username = req.user.username
            comment.save()
            res.redirect('/news/my-latest-release')
        }
    })
})

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect('/login')
}


// ===============================================================

app.listen(process.env.PORT || 8080, process.env.IP, () => {
    console.log('Server running')
})