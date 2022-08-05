// EXPRESS SETUP
// First, we require Express and create our Express app by calling 
// express(). Then we define the directory from which to serve our static files.
const express = require('express');
const app = express();

app.use(express.static(__dirname));

// The next line sees us require the body-parser middleware, 
// which will help us parse the body of our requests. 
const bodyParser = require('body-parser');
const exp = require('constants');

// We’re also adding the express-session middleware 
// to help us save the session cookie.
const expressSession = require('express-session')({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(expressSession);

// Then, we use process.env.PORT to set the port to the 
// environment port variable if it exists.
const port = process.env.PORT || 3000;
app.listen(port, () => console.log('App listening on port ' + port));

// PASSPORT SETUP
const passport = require('passport');

app.use(passport.initialize());
app.use(passport.session());

// MONGOOSE SETUP
const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

// Then we connect to our database using mongoose.connect 
// and give it the path to our database
mongoose.connect('mongodb://localhost/MyDatabase', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// In this case, we’re creating a UserDetail
//  schema with username and password fields.
const Schema = mongoose.Schema;
const UserDetail = new Schema({
    username: String,
    password: String
});


// Finally, we add passportLocalMongoose as a plugin to our Schema.
// The first parameter is the name of the collection in the database. 
// The second one is the reference to our Schema, 
// and the third one is the name we’re assigning to the collection inside Mongoose.
UserDetail.plugin(passportLocalMongoose);
const UserDetails = mongoose.model('userInfo', UserDetail, 'userInfo');

//PASSPORT LOCAL AUTHENTICATION

// First, we make passport use the local strategy by
// calling createStrategy() on our UserDetails model — 
// courtesy of passport-local-mongoose— which takes care of
// everything so that we don’t have to set up the strategy
passport.use(UserDetails.createStrategy());
// Then we’re using serializeUser and deserializeUser callbacks. 
// The first one will be invoked on authentication, and its job is
//  to serialize the user instance with the information we pass on 
//  to it and store it in the session via a cookie. The second one 
//  will be invoked every subsequent request to deserialize the 
//  instance, providing it the unique cookie identifier as a “credential”.
passport.serializeUser(UserDetails.serializeUser());
passport.deserializeUser(UserDetails.deserializeUser());

// ROUTES
// At the top, we’re requiring connect-ensure-login
const connectEnsureLogin = require('connect-ensure-login');

// Next, we set up a route to handle a POST request to the /login path. 
// Inside the handler, we use the passport.authenticate method, 
// which attempts to authenticate with the strategy it receives as 
// its first parameter — in this case local. If authentication fails, 
// it will redirect us to /login, but it will add a query parameter — info — 
// that will contain an error message. Otherwise, if authentication is 
// successful, it will redirect us to the '/' route.
app.post('/login', (req, res, next) => {
    passport.authenticate('local',
        (err, user, info) => {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.redirect('/login?info=' + info);
            }

            req.logIn(user, function (err) {
                if (err) {
                    return next(err);
                }

                return res.redirect('/');
            });
        })(req, res, next);
});

// Then we set up the /login route, which will send the login page. 
// For this, we’re using res.sendFile() and passing in the file path 
// and our root directory, which is the one we’re working on — hence
// the __dirname.
app.get("/login",
    (req, res) => res.sendFile("html/login.html", {
        root: __dirname
    })
);
// Before the callback, we’re adding the connectEnsureLogin.ensureLoggedIn() call. 
// This is our route guard. Its job is validating the session to make sure you’re 
// allowed to look at that route.
app.get("/",
    connectEnsureLogin.ensureLoggedIn(),
    (req, res) => res.sendFile("html/index.html", {
        root: __dirname
    })
);

app.get("/private",
    connectEnsureLogin.ensureLoggedIn(),
    (req, res) => res.sendFile("html/private.html", {
        root: __dirname
    })
);

// Finally, we’ll need a /user route, which will return an 
// object with our user information. This is just to show you 
// how you can go about getting information from the server. 
// We’ll request this route from the client and display the result.
app.get("/user",
    connectEnsureLogin.ensureLoggedIn(),
    (req, res) => res.send({
        user: req.user
    })
);

// Also there’s a logout route to end the login session. 
// This is done easily using the passport logout method. 
// This will route to its own HTML page.
app.get("/logout",
    (req, res) => {
        // The other major change is that that req.logout() 
        // is now an asynchronous function, whereas previously 
        // it was synchronous. For instance, a logout route that 
        // was previously:
        req.logout(function (err) {
                if (err) {
                    return next(err);
                }
            }),

            res.sendFile("html/logout.html", {
                root: __dirname
            });
    });


// REGISTER SOME USERS
// UserDetails.register({
//     username: 'paul',
//     active: false
// }, 'paul');
// UserDetails.register({
//     username: 'joy',
//     active: false
// }, 'joy');
// UserDetails.register({
//     username: 'ray',
//     active: false
// }, 'ray');