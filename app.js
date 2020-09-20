require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose');
const methodOverride = require('method-override');
const flash = require('connect-flash');
var today = new Date();
var minutes = '';
var prevURL = '';

if (Number(today.getMinutes()) < 10){
    minutes = '0' + today.getMinutes()
} else {
    minutes = today.getMinutes()
}

const date = today.getDate() + '-' + (Number(today.getMonth()) + 1).toString() + '-' + today.getFullYear() + ' at ' + today.getHours() + ':' + minutes
// const back = require('express-back');
var passwordMatch = true;

const app = express();

app.use(express.static('public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(flash())

const sessionSecret = process.env.SESSION_SECRET

app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false
}));

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    next();
})

// app.use(back())
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb+srv://<username>:<password>@cluster0.cz9bm.mongodb.net/<dbname>?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });
// mongoose.connect('mongodb://localhost:27017/deckstarUserDB', {useNewUrlParser: true, useUnifiedTopology: true})

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
    prevURL = req.get('referer')
    res.render('login', {currentUser: req.user});
})

app.get('/signup', (req, res) => {
    res.render('signup', {currentUser: req.user, passwordMatch: passwordMatch});
})

app.get('/profile', (req, res) => {
    res.render('profile', {currentUser: req.user})
})

app.post('/signup', function(req, res){
    const username = req.body.username
    const email = req.body.email
    const password = req.body.password
    const password2 = req.body.password2

    if(password != password2){
        req.flash('error', 'Passwords do not match.')
        passwordMatch = false
        res.redirect('/signup')
    } else {
        User.register({
            username: username,
            email: email},
            password, function(err, user){
            if(err){
                console.log(err);
                req.flash('error', err.message)
                res.redirect('/signup')
            } else {
                passwordMatch = true
                passport.authenticate('local')(req, res, function(){
                    req.flash('success', 'Welcome, ' + user.username + '!')
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
        } else if (prevURL !== "http://deckstarg.herokuapp.com/signup"){
            passport.authenticate('local', {successRedirect: prevURL, failureRedirect: '/login'})(req, res, function(){
            })
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
            // var reversedComments = [];
            // allComments.forEach(function(comment){
            //     reversedComments.push(comment)
            // })
            // reversedComments.reverse()
            res.render('news/100-sub-giveaway', {comments: allComments, currentUser: req.user})
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
            req.flash('success', 'Comment added.')
            res.redirect('/news/100-sub-giveaway')
        }
    })
})

app.get('/:comment_id/edit', checkCommentOwnership, (req, res) => {
    prevURL = req.get('referer')
    Comment.findById(req.params.comment_id, function(err, foundComment){
        if(err){
            console.log(err)
            res.redirect('back')
        } else {
            res.render('comments/edit-100-sub-giveaway', {comment: foundComment, commentText: foundComment.text, currentUser: req.user})
        }
    })
})

app.put('/:comment_id', checkCommentOwnership, (req, res) => {
    Comment.findOneAndUpdate({_id: req.params.comment_id}, {$set:{text: req.body.text}}, function(err, updatedComment){
        if(err){
            console.log(err)
            res.redirect('back')
        } else {
            req.flash('success', 'Comment updated.')
            res.redirect(prevURL);
        }
    })
})

app.delete('/:comment_id', checkCommentOwnership, (req, res) => {

    Comment.findByIdAndRemove(req.params.comment_id, function(err, removedComment){
        if(err){
            console.log(err)
            res.redirect('back')
        } else {
            req.flash('success', 'Comment deleted.')
            res.redirect('back');
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
    req.flash('error', 'Please login first.')
    res.redirect('/login')
}

function checkCommentOwnership(req, res, next){
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, foundComment){
            if(err){
                req.flash('error', 'Could not find comment ID on database.')
                console.log(err)
                res.redirect('back')
            } else {
                if(foundComment.author.id.equals(req.user._id)){
                    next()
                } else {
                    req.flash('error', 'You do not own this comment.')
                    res.redirect(req.get('referer'));
                }
            }
        })
    } else {
        req.flash('error', 'Please login first.')
        res.redirect('/login')
    }
}


// ===============================================================

app.listen(process.env.PORT || 8080, process.env.IP, () => {
    console.log('Server running')
})