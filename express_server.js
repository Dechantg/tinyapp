

const express = require("express");
const app = express();

const PORT = 8080;

app.set("view engine", "ejs");

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

const urlDatabase = {
  "b2xVn2" : "http://www.lighthouselabs.ca",
  "9sm5xK" : "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");

});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// 6 string randome key generator for URL keys
const generateRandomString = () => {
  //list of valid letters to use
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = "";
  // loop through with math random and push 6 random characters to return
  for (let i = 0; i < 6; i++) {
    const list = Math.floor(Math.random() * letters.length);
    randomString += letters.charAt(list);
  }
  return randomString;

};

app.use(express.urlencoded({ extended: true }));

app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  const key = generateRandomString(); // use my new random key generator
  urlDatabase[key] = req.body.longURL; // push randome key and url
  res.redirect(`/urls/${key}`); //redirect to urls/key
});


app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});



app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

// create call for users to use the short url key to go straight to the webpage
app.get("/u/:id", (req, res) => {
  const key = req.params.id; // pull the key from the reqest
  const longURL = urlDatabase[key]; // pull the URL based on the key given
  res.redirect(longURL); // redirect to the url

});
