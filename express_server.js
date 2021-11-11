const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:true}));
const cookieParser = require('cookie-parser')
app.use(cookieParser());
const PORT = 8080;

app.set('view engine', 'ejs');

const urlDatabase = {
    b6UTxQ: {
        longURL: "https://www.tsn.ca",
        userID: "aJ48lW"
    },
    i3BoGr: {
        longURL: "https://www.google.ca",
        userID: "aJ48lW"
    }
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

app.get('/', (req, res) => { 
  res.send('Hello!');
});

app.listen(PORT, () => {
  console.log(`Example apps listening on port ${PORT}!`);
});

// URL database JSON
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/Hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

// Shows user URL database.
app.get('/urls', (req, res) => {
  const userid = req.cookies['user_id']
  const userURLs = urlsForUser(userid)

  const templateVars = {
    user_id: userid, 
    email: getEmailFromId(userid),
    urls: userURLs,
  };

  res.render('urls_index', templateVars);
});

// Form to enter URL to be shortened.
app.get('/urls/new', (req, res) => {
  const templateVars = {
    user_id: req.cookies['user_id'], 
    email: getEmailFromId(req.cookies['user_id']),
  };

  if (!req.cookies['user_id']) {
    res.redirect('/login');
  }

  res.render('urls_new', templateVars);
});

// Shows individual page with longURL and shortURL as a link to visit the site.
app.get('/urls/:shortURL', (req, res) => {
  const url = urlDatabase[req.params.shortURL];
  
  if (url === undefined) {
    return res.sendStatus(404);
  }

  const templateVars = {
    user_id: req.cookies['user_id'], 
    email: getEmailFromId(req.cookies['user_id']),
    shortURL: req.params.shortURL,
    longURL: url.longURL
  };

  res.render('urls_show', templateVars);
});

// generates a short URL and adds it to the database.
app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  const shortGen = generateRandomString();
  urlDatabase[shortGen] = { longURL: req.body.longURL, userID: req.cookies['user_id'] };
  res.redirect(`/urls/${shortGen}`);
});

// redirects shortURL to the longURL website.
app.get('/u/:shortURL', (req, res) => {
  const url = urlDatabase[req.params.shortURL];
  
  if (url === undefined) {
    return res.sendStatus(404);
  }

  let go = url.longURL;

  if (go.includes('http://') || go.includes('https://')) {
    return res.redirect(go);
  }

  res.redirect(`http://${go}`);
});

// post request to delete a shortURL from users list. Redirects back to URLs page essentially refreshing.
app.post("/urls/:shortURL/delete", (req, res) => {
  const urlToDelete = req.params.shortURL;
  console.log('url to delete', urlToDelete);
  delete urlDatabase[urlToDelete];
  res.redirect(`/urls/`);
});

// updates the url for the shortURL page you're on.
app.post("/urls/:shortURL", (req, res) => {
  const shorturlToUpdate = req.params.shortURL;
  const longURL = req.body.longURL;
  console.log('req.params', req.params);
  console.log('req body', req.body);
  urlDatabase[shorturlToUpdate].longURL = longURL;
  res.redirect(`/urls/`);
});

app.get("/register", (req, res) => {
  const templateVars = {
    user_id: req.cookies['user_id'], 
    email: getEmailFromId(req.cookies['user_id']),
  };

  res.render('user_register', templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = {
    user_id: req.cookies['user_id'], 
    email: getEmailFromId(req.cookies['user_id']),
  };

  res.render('user_login', templateVars);
});

// creates a user when registration form is submitted
app.post("/register", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.sendStatus(404);
  }

  const emailExists = userLookup(email);
  if (emailExists) {
    return res.sendStatus(404);
  }

  
  const shortGen = generateRandomString();
  users[shortGen] = { id: shortGen, email, password };
  res.cookie('user_id', shortGen);
  console.log(users);
  res.redirect('/urls');
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.sendStatus(404);
  }

  if (!userLookup(email)) {
    return res.sendStatus(403)
  }
  const id = userLookup(email);
  
  if (users[id].password !== password) {
    return res.sendStatus(403)
  }

  res.cookie('user_id', id);
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

// for generating shortURL strings.
function generateRandomString() {
    return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
};

const userLookup = function(newEmail) {
  for (const id in users) {
    if (users[id].email === newEmail) {
      return id;
    }
  }

  return false;
};

const getEmailFromId = user_id => {
  return (users[user_id]) ? users[user_id].email : null;
};

const urlsForUser = function(id) {
  const userURLs = {};

  if (!id) {
    return null;
  }

  for (const item in urlDatabase) {
    if (urlDatabase[item].userID === id) {
      userURLs[item] = urlDatabase[item];
    }
  }

  return userURLs;
  console.log(userURLs);
};