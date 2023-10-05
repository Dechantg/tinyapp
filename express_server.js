

const express = require("express");
const morgan = require("morgan");
const app = express();
const cookieParser = require("cookie-parser");
const PORT = 8080;
app.set("view engine", "ejs", "cookie-parser");



// middleware
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

const getUserByEmail = (userId) => {
  for (const id in users) {
    if (users[id].email === userId) {
      return true;
    }
  }
  return false; 
}

const getPwdByEmail = (email, pwd) => {
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email && user.password === pwd) {
      return true;
    }
  }
  return false;
};


app.get("/urls", (req, res) => {

  const templateVars = { 
    user: users,
    urls: urlDatabase };
  res.render("urls_index", templateVars);
});


const users = {
  userRandomID: {
    id: "user1",
    email: "a@b.com",
    password: "1234",
  },
  user2RandomID: {
    id: "user2",
    email: "c@d.com",
    password: "5678",
  },
};




const urlDatabase = {
  "b2xVn2" : "http://www.lighthouselabs.ca",
  "9sm5xK" : "http://www.google.com"
};

app.get("/", (req, res) => {
  res.redirect("/urls");

});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// 6 string randome key generator for URL keys
const generateRandomString = (char) => {
  //list of valid letters to use using what andy showed in lecture
  const randomString = Math.random().toString(36).substring(2, char);
  console.log(`Random String for shortURL: ${randomString}`);
  
  return randomString;

};

app.get("/login", (req, res) => {
  res.render("login");
});


app.post("/login", (req, res) => {
  const userId = req.body.userId;
  const pwd = req.body.password;
  if (!getUserByEmail(userId)) {
    return res.status(403).send("Invalid Login, please check your username or register");
  }

if (!getPwdByEmail(userId, pwd)) {
  return res.status(403).send("Error!! Invalid Password, please check your login and try again");
}


  for (const id in users) {
    if (users[id].email === userId) {
      res.cookie("userId", id);
      // Render the login.ejs template with the appropriate variables
      return res.redirect("/urls");
    }
  }

  return res.status(401).send("Login failed: Invalid username or password");
});


app.get("/urls", (req, res) => {
  


  const userId = req.cookies["userId"];
  const templateVars = {
    user: users,
    urls: urlDatabase,
    userId: userId,
  };

  // Check if a user with the given ID exists
  if (userId && users[userId]) {
    templateVars.email = users[userId].email;
  }

  res.render("urls_index", templateVars);
});



app.post("/urls", (req, res) => {
  console.log(req.body.userId); // Log the POST request body to the console
  

  res.redirect(`/urls`); 
});




app.post("/urls_add", (req, res) => {

  console.log(req.body); // Log the POST request body to the console
  const key = generateRandomString(8); // use my new random key generator
  urlDatabase[key] = req.body.longURL; // push randome key and url
  const userId = req.cookies["userId"];

 
});




app.post("/urls/:id/edit", (req, res) => {
  const editID = req.params.id;

  urlDatabase[editID] = req.body.longURL;
  

  res.redirect("/urls");
});


app.get("/urls/new", (req, res) => {

  const userIdCookie = req.cookies.userId
  const templateVars = {
    email: users[userIdCookie].email,
  };
  res.render("urls_new", templateVars);
});


app.get("/urls/:id", (req, res) => {

  const userIdCookie = req.cookies.userId

  
  const templateVars = { id: req.params.id,
    longURL: urlDatabase[req.params.id],
    userId: req.cookies["userId"],
    email: users[userIdCookie].email,   };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id/delete", (req, res) => {
  const deleteID = req.params.id;

  delete urlDatabase[deleteID];

  res.redirect("/urls");
});

// // create call for users to use the short url key to go straight to the webpage
app.get("/u/:id", (req, res) => {
  const key = req.params.id; // pull the key from the reqest
  const longURL = urlDatabase[key]; // pull the URL based on the key given
  res.redirect(longURL); // redirect to the url

});


app.post("/logout", (req, res) => {

  res.clearCookie("userId");
    res.redirect("/login");

});

app.get("/register", (req, res) => {
  const templateVars = {
    userId: req.cookies["userId"],
  };
  res.render("register", templateVars);
});


app.post("/submitId", (req, res) => {

  if (!req.body.userId || !req.body.password) {
    return res.status(400).send("Error!! Please enter a valid Email and Password");
  };

  if (getUserByEmail(req.body.userId)) {
    return res.status(400).send("Error!! Email already exists. Please login");
  }




  const newId = generateRandomString(8); // use my new random key generator

  const newUser = {
    id: newId,
    email: req.body.userId,
    password: req.body.password,
  };

  users[newId] = newUser;
  res.cookie("userId", newId);



  console.log(newId);
  console.log(req.body.email);
  console.log(users);
  res.redirect("/urls");
});
