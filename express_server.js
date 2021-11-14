const PORT = 8080;
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const { userLookup, urlsForUser, getEmailFromId, generateRandomString } = require('./helpers.js');
const app = express();

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended:true}));

app.set('view engine', 'ejs');

app.listen(PORT, () => {
  console.log(`Example apps listening on port ${PORT}!`);
});


// DATABASE ------------------------------------------------>

// for storing user urls.
const urlDatabase = {};

// user database.
const users = {};

// URL database JSON
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});


// GET REQUESTS TO LOAD USER PAGES ------------------------------>

// Homepage. Redirects visitor to /login page if not signed in or /urls page if they are.
app.get('/', (req, res) => {
  console.log(req.session.id);

  if (req.session.id === undefined) {
    return res.redirect('/login')
  }

  res.redirect('/urls');
});

// Shows user specific URLs.
app.get('/urls', (req, res) => {
  const userid = req.session.id;
  const userURLs = urlsForUser(userid, urlDatabase);

  const templateVars = {
    user_id: userid,
    email: getEmailFromId(userid, users),
    urls: userURLs,
  };

  res.render('urls_index', templateVars);
});

// Form to enter URL to be shortened.
app.get('/urls/new', (req, res) => {
  const templateVars = {
    user_id: req.session.id,
    email: getEmailFromId(req.session.id, users),
  };

  if (!req.session.id) { // if no user is loggen in, redirect to login page.
    res.redirect('/login');
  }

  res.render('urls_new', templateVars);
});

// Shows individual page for shortURL with a form to edit the link.
app.get('/urls/:shortURL', (req, res) => {
  const url = urlDatabase[req.params.shortURL];
  const checkurl = req.params.shortURL;
  const userid = req.session.id;

  if (url === undefined) { // if url doesn't exist in users database, 404.
    res.redirect('/not_found');
    return;
  }

  if (urlDatabase[checkurl].userID !== userid) { // prevents accessing of URLs by users that don't own them.
    res.redirect('/no_permissions');
    return;
  }

  const templateVars = {
    user_id: userid,
    email: getEmailFromId(userid, users),
    shortURL: req.params.shortURL,
    longURL: url.longURL
  };

  res.render('urls_show', templateVars);
});

// redirects shortURL to the longURL website.
app.get('/u/:shortURL', (req, res) => {
  const url = urlDatabase[req.params.shortURL];
  
  if (url === undefined) { // if shortURL isn't in database, 404.
    res.redirect('/not_found');
    return;
  }

  let go = url.longURL;

  //check to see if url needs http:// added to it or not.
  if (go.includes('http://') || go.includes('https://')) {
    return res.redirect(go);
  }

  res.redirect(`http://${go}`);
});

// render the user register page
app.get("/register", (req, res) => {
  const templateVars = {
    user_id: req.session.id,
    email: getEmailFromId(req.session.id, users),
  };

  if (req.session.id !== undefined) { // redirects user to thier urls page if they are already logged in.
    return res.redirect('/urls')
  }

  res.render('user_register', templateVars);
});

// render the user login page
app.get("/login", (req, res) => {
  const templateVars = {
    user_id: req.session.id,
    email: getEmailFromId(req.session.id, users),
  };

  if (req.session.id !== undefined) { // redirects user to thier urls page if they are already logged in.
    return res.redirect('/urls')
  }

  res.render('user_login', templateVars);
});

// GET REQUESTS TO LOAD USER PAGES END --------------------------------------/


// GET REQUESTS FOR ERROR pages ----------------------------------------- >

// 404 page
app.get("/not_found", (req, res) => {
  const userid = req.session.id;
  const userURLs = urlsForUser(userid, urlDatabase);

  const templateVars = {
    user_id: userid,
    email: getEmailFromId(userid, users),
    urls: userURLs,
  };

  res.render('not_found', templateVars);
});

// someones already signed up
app.get("/wrong", (req, res) => {
  const userid = req.session.id;
  const userURLs = urlsForUser(userid, urlDatabase);

  const templateVars = {
    user_id: userid,
    email: getEmailFromId(userid, users),
    urls: userURLs,
  };

  res.render('wrong', templateVars);
});

// couldn't find that email in our database
app.get("/wrong_creds", (req, res) => {
  const userid = req.session.id;
  const userURLs = urlsForUser(userid, urlDatabase);

  const templateVars = {
    user_id: userid,
    email: getEmailFromId(userid, users),
    urls: userURLs,
  };

  res.render('wrong_creds', templateVars);
});

// no permissions to view
app.get("/no_permissions", (req, res) => {
  const userid = req.session.id;
  const userURLs = urlsForUser(userid, urlDatabase);

  const templateVars = {
    user_id: userid,
    email: getEmailFromId(userid, users),
    urls: userURLs,
  };

  res.render('no_permissions', templateVars);
});

// GET REQUESTS FOR ERROR PAGES END --------------------------------------/


// POST REQUESTS ---------------------------------------->

// generates a short URL and adds it to the users database.
app.post("/urls", (req, res) => {
  const shortGen = generateRandomString();
  const userid = req.session.id;

  if (!userid) {
    return res.sendStatus(403); // prevents people from creating new urls using cURL in terminal;
  }

  urlDatabase[shortGen] = { longURL: req.body.longURL, userID: req.session.id };
  res.redirect(`/urls/${shortGen}`);
});

// post request to delete a shortURL from users list. Redirects back to URLs page essentially refreshing.
app.post("/urls/:shortURL/delete", (req, res) => {
  const urlToDelete = req.params.shortURL;
  const userid = req.session.id;

  if (urlDatabase[urlToDelete].userID !== userid) { // prevents deletion of URLs by users that don't own them.
    res.redirect('/no_permissions');
    return;
  }

  delete urlDatabase[urlToDelete];
  res.redirect(`/urls/`);
});

// updates the url for the shortURL page you're on.
app.post("/urls/:shortURL", (req, res) => {
  const shorturlToUpdate = req.params.shortURL;
  const longURL = req.body.longURL;
  const userid = req.session.id;

  if (urlDatabase[shorturlToUpdate].userID !== userid) { // prevents changing of URLs by users that don't own them.
    res.redirect('/no_permissions');
    return;
  }

  urlDatabase[shorturlToUpdate].longURL = longURL;
  res.redirect(`/urls/`);
});

// creates a user when registration form is submitted
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashPass = bcrypt.hashSync(password, 10);

  if (!email || !password) { // if either field is empty, 404.
    res.redirect('/wrong');
    return;
  }

  const emailExists = userLookup(email, users); // if email exists already, 404.
  if (emailExists) {
    res.redirect('/wrong');
    return;
  }

  
  const shortGen = generateRandomString(); // generates a random sting to assign as users.id.
  users[shortGen] = { id: shortGen, email, password: hashPass }; // creates user object in database.
  req.session.id = shortGen; // logs in user and creates encrypted cookie to track them.
  res.redirect('/urls');
});

// login existing user
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  
  if (!email || !password) { // if email or password are missing, 404.
    res.redirect('/wrong_creds');
    return;
  }
  
  if (!userLookup(email, users)) {  // if email doesn't exists, 403.
    res.redirect('/wrong_creds');
    return;
  }

  const id = userLookup(email, users); // get user id
  
  if (!bcrypt.compareSync(password, users[id].password)) { // if email/password don't match, 403.
    res.redirect('/wrong_creds');
    return;
  }

  req.session.id = id; // login and create encrypted user cookie
  res.redirect('/urls');
});

// logout user and delete all session cookies
app.post("/logout", (req, res) => {
  req.session = null; // delete users cookies
  res.redirect('/urls');
});

// POST REQUESTS END --------------------------------------/