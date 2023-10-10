

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



const users = {};
const urlDatabase = {};


app.get("/", (req, res) => {
  
 
  if (!req.session.userId) {
    return res.redirect("/login");
  }

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
    return res.status(403).send("Invalid Login, please check your username and <a href='/login'>try again</a> or <a href='/register'>register</a>.");
  }
  const idFromEmail = (getUserByEmail(userId, users));
  const hashedPassword = users[idFromEmail].password;
  const passwordMatch = bcrypt.compareSync(req.body.password, hashedPassword);

  if (passwordMatch) {
    req.session.userId = idFromEmail;
    return res.redirect("/urls");
  }

  return res.status(403).send("Invalid username or password, please <a href='/login'>try again</a> or <a href='/register'>register</a>.");}
  );


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
    return res.status(403).send("Invalid username or password, please <a href='/register'>try again</a>.");
  }

  if (getUserByEmail(req.body.userId, users)) {
    return res.status(400).send("Username already exists, please Login <a href='/login'>login</a> or <a href='/register'>try again</a>.");
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
    return res.status(403).send("You need to be logged in to view links. Please <a href='/login'>login</a> or <a href='/register'>register</a>.");
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
    return res.status(403).send("You need to be logged in to view links. Please <a href='/login'>login</a> or <a href='/register'>register</a>.");
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
   
    return res.status(403).send("You need to be logged in to edit links. Please <a href='/login'>login</a> or <a href='/register'>register</a>.");
  }
   
 
  if (userSessionId !== urlDatabase[shortUrl].userId) {
    return res.status(403).send("You cannot edit a link you do not own. Please <a href='/login'>login</a> or <a href='/register'>register</a>.");
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
    return res.status(403).send("You need to be logged in to edit links. Please <a href='/login'>login</a> or <a href='/register'>register</a>.");
  }

  if (!userId) {
    return res.status(403).send("You need to be logged in to view this page. Please <a href='/login'>login</a> or <a href='/register'>register</a>.");
  }

  if (!urlDatabase[urlId]) {
    return res.status(404).send("URL not found");
  }

  if (urlDatabase[urlId].userId !== userId) {
    return res.status(403).send("This is not your URL. Please <a href='/login'>login</a> or <a href='/register'>register</a>.");
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
    return res.status(403).send("You need to be logged in to delete cookies. Please <a href='/login'>login</a> or <a href='/register'>register</a>.");
  }

  if (!urlDatabase[deleteID]) {
    return res.status(404).send("This cookie does not exist.");
  }

  const userId = urlDatabase[deleteID].userId;

  const userDeleting = users[userSessionId].id;
  if (userDeleting !== userId) {
    return res.status(403).send("You cannot delete a cookie you do not own. Please <a href='/login'>login</a> or <a href='/register'>register</a>.");
  }

  delete urlDatabase[deleteID];

  res.redirect("/urls");
});


// create call for users to use the short url key to go straight to the webpage
app.get("/u/:id", (req, res) => {
  const key = req.params.id; // pull the key from the reqest
  const longUrl = urlDatabase[key].longUrl; // pull the URL based on the key given
  const userSessionId = req.session.userId;


  if (!userSessionId) {
    return res.status(403).send("You need to be logged in to use links. Please <a href='/login'>login</a> or <a href='/register'>register</a>.");
  }

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



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
