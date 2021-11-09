const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:true}));
const PORT = 8080; //default port 8080

app.set('view engine', 'ejs');

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  const templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});

// Form to enter URL to be shortened.
app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});

// Shows individual page with longURL and shortURL as a link to visit the site.
app.get('/urls/:shortURL', (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render('urls_show', templateVars);
});

// generates a short URL and adds it to the database.
app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  const shortGen = generateRandomString();
  urlDatabase[shortGen] = req.body.longURL;
  res.redirect(`/urls/${shortGen}`);
});

// redirects shortURL to the longURL website.
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(`http://${longURL}`);
});

// for generating shortURL strings.
function generateRandomString() {
    return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
};