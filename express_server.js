

const express = require("express");
const morgan = require("morgan");
const bcrypt = require("bcryptjs");
const { getUserByEmail, generateRandomString } = require("./helpers");

const app = express();
const cookieSession = require("cookie-session");
const PORT = 8080;
app.set("view engine", "ejs", "cookie-parser");



// middleware
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieSession({
  name: "session",
  keys: ["23579823fbn2uihb8gf723b"]
}));

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


const users = {};
const urlDatabase = {};


app.get("/", (req, res) => {
  res.redirect("/urls");

});


app.get("/login", (req, res) => {
 
  const templateVars = {
    email: null,
  };

  if (users[req.session.userId]) {
    return res.redirect("/urls");
  }

  res.render("login", templateVars);
});


app.post("/login", (req, res) => {
 
  const userId = req.body.userId;
  
  if (!getUserByEmail(userId, users)) {
    return res.status(403).send("Invalid Login, please check your username or register");
  }
  const idFromEmail = (getUserByEmail(userId, users));
  const hashedPassword = users[idFromEmail].password;
  const passwordMatch = bcrypt.compareSync(req.body.password, hashedPassword);

  if (passwordMatch) {
    req.session.userId = idFromEmail;
    return res.redirect("/urls");
  }

  return res.status(401).send("Login failed: Invalid username or password");
});


// the get for the regitar page, linked to the submit id post
app.get("/register", (req, res) => {
   

  if (users[req.session.userId]) {
    return res.redirect("/urls");
  }
  const templateVars = {
    userId: req.session["userId"],
    email: null,

  };
  res.render("register", templateVars);
});

//process for registaring new users

app.post("/submitId", (req, res) => {

  if (!req.body.userId || !req.body.password) {
    return res.status(400).send("Error!! Please enter a valid Email and Password");
  }

  if (getUserByEmail(req.body.userId, users)) {
    return res.status(400).send("Error!! Email already exists. Please login");
  }

  const newId = generateRandomString(8);

  const hashedPassword = bcrypt.hashSync(req.body.password, 10);

  const newUser = {
    id: newId,
    email: req.body.userId,
    password: hashedPassword,
  };

  users[newId] = newUser;
  req.session.userId = newId;

  res.redirect("/urls");
});


app.get("/urls", (req, res) => {
  const userSessionId = req.session.userId;

  if (!req.session.userId) {
    return res.redirect("/login");
  }

  if (!userSessionId || !users[userSessionId]) {
    const templateVars = {
      user: users,
      urls: {},
      email: null,
    };
    return res.render("urls_index", templateVars);
  }
  
  const userEmail = users[userSessionId].email;
  
  const userUrls = {};
  for (const key in urlDatabase) {
    if (urlDatabase[key].userId === userSessionId) {
      userUrls[key] = urlDatabase[key];
    }
  }

  const templateVars = {
    user: users,
    urls: userUrls,
    userId: userSessionId,
    email: userEmail,
  };

  res.render("urls_index", templateVars);
});



app.post("/urls", (req, res) => {

  if (!req.session.userId) {
    return res.send("You need to be logged in.");
  }

  res.redirect(`/urls`);
});



// post to add new items to the database
app.post("/urls_add", (req, res) => {

  const key = generateRandomString(8);
  const longUrl = req.body.longUrl;
  const userId = req.session.userId;

  urlDatabase[key] = {
    longUrl,
    userId,
  };

  res.redirect(`/urls/${key}`);
});


app.post("/urls/:id/edit", (req, res) => {
  const userSessionId = req.session.userId;
  const shortUrl = req.params.id;

  if (!userSessionId) {
   
    return res.send("You need to be logged in to edit links.");
  }
   
 
  if (userSessionId !== urlDatabase[shortUrl].userId) {
    return res.send("You cannot edit a cookie you do not own.");
  }

  urlDatabase[shortUrl].longUrl = req.body.longUrl;

  res.redirect("/urls");
});


app.get("/urls/new", (req, res) => {

  if (!req.session.userId) {
    return res.redirect("/login");
  }

  const userSessionId = req.session.userId;
  
  const userEmail = users[userSessionId].email;

  const templateVars = {
    email: userEmail,
  };
  
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const userId = req.session.userId;
  const urlId = req.params.id;

  if (!req.session.userId) {
    return res.redirect("/login");
  }

  if (!userId) {
    return res.send("You need to be logged in to view this page");
  }

  if (!urlDatabase[urlId]) {
    return res.status(404).send("URL not found");
  }

  if (urlDatabase[urlId].userId !== userId) {
    return res.send("This is not your URL");
  }

  const templateVars = {
    id: req.params.id,
    longUrl: urlDatabase[req.params.id].longUrl,
    userId: req.session["userId"],
    email: users[userId].email,
  };

  res.render("urls_show", templateVars);
});


// delete url function. Varifies existance and ownership
app.post("/urls/:id/delete", (req, res) => {
  const userSessionId = req.session.userId;
  const deleteID = req.params.id;

  if (!userSessionId) {
    return res.send("You must be logged in to delete cookies.");
  }

  if (!urlDatabase[deleteID]) {
    return res.send("This cookie does not exist.");
  }

  const userId = urlDatabase[deleteID].userId;

  const userDeleting = users[userSessionId].id;
  if (userDeleting !== userId) {
    return res.send("You cannot delete a cookie you do not own.");
  }

  delete urlDatabase[deleteID];

  res.redirect("/urls");
});


// create call for users to use the short url key to go straight to the webpage
app.get("/u/:id", (req, res) => {
  const key = req.params.id; // pull the key from the reqest
  const longUrl = urlDatabase[key].longUrl; // pull the URL based on the key given
  if (!longUrl) {
    return res.status(404).send("URL not found");
  }
  
  res.redirect(longUrl); // redirect to the url
});


//logout, clear cookie and return to login
app.post("/logout", (req, res) => {

  req.session = null;
  res.redirect("/login");

});
