

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





app.get("/urls", (req, res) => {

  const templateVars = { 
    username: req.cookies["username"],
    urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// // const username = {};

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
const generateRandomString = () => {
  //list of valid letters to use using what andy showed in lecture
  const randomString = Math.random().toString(36).substring(2, 8);
  console.log(`Random String for shortURL: ${randomString}`);
  
  return randomString;

};



app.post("/login", (req, res) => {
  console.log(req.body.username);
  const username = req.body.username;

  res.cookie("username", username);
    res.redirect("/urls");

});



app.post("/urls", (req, res) => {
  console.log(req.body.username); // Log the POST request body to the console
  

  res.redirect(`/urls`); 
});




app.post("/urls_add", (req, res) => {

  console.log(req.body); // Log the POST request body to the console
  const key = generateRandomString(); // use my new random key generator
  urlDatabase[key] = req.body.longURL; // push randome key and url
  const username = req.cookies.username;
 
});




app.post("/urls/:id/edit", (req, res) => {
  const editID = req.params.id;

  urlDatabase[editID] = req.body.longURL;

  res.redirect("/urls");
});


app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
  };
  res.render("urls_new", templateVars);
});


app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id,
    longURL: urlDatabase[req.params.id],
    username: req.cookies["username"]
   };
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
  console.log(req.body.username);

  res.clearCookie("username");
    res.redirect("/urls");

});

