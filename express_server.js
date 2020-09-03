const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "aJ48lW" },
  "9sm5xK": { longURL: "http://www.google.com",  userID: "aJ48lW" }
};

function generateRandomString() {
  return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 6);
};

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser');
app.use(cookieParser())

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

const isEmailExists = function(email, users) {
  for (user in users) {
    if (email.toLowerCase().trim() === users[user].email.toLowerCase().trim()) {
      return users[user];
    }
  }
  return false;
};

const urlsForUser = function(id){
  const urls = {};
  if (id) {
    for (url in urlDatabase) {
      if (id === urlDatabase[url].user_id){
        urls[url] = urlDatabase[url]
      }
    }
  }
  return urls;
};

// Route for submisson of registeration form
app.post("/register", (req, res) => {
  let user = {};
  if (!req.body.email || !req.body.password) {
    res.status(400);
    res.send('Fill all required fields');
  } else {
    if (isEmailExists(req.body.email, users)) {
      res.status(400);
      res.send('Email already exists');
    } else {
      user["id"] = generateRandomString();
      user["email"] = req.body.email;
      user["password"] = req.body.password;
      users[user["id"]] = user;
      res.cookie('user_id', user["id"]);
      let templateVars = { urls: urlsForUser(req.cookies["user_id"]), user: user };
    
      res.render("urls_index", templateVars);  
    }
  }
});

// Route for submition of login form
app.post("/login", (req, res) => {
  let user = {};
  if (!req.body.email || !req.body.password) {
    res.status(400);
    res.send('Fill all required fields');
  } else {
    let user = isEmailExists(req.body.email, users);
    if (!user) {
      res.status(403);
      res.send('E-mail cannot be found');
    } else {
      if (user.password === req.body.password) {
        let templateVars = { urls: urlsForUser(req.cookies["user_id"]), user: user };
        res.cookie('user_id', user["id"]);
        res.render("urls_index", templateVars);  
      }
      else {
        res.status(403);
        res.send('Wrong password');
      }
    }  
  }
});

// Route to render register form
app.get("/register", (req, res) => {
  let templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]] };
  res.render("register", templateVars);  
});

// Route to render login form
app.get("/login", (req, res) => {
  let templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]] };
  res.render("login", templateVars);  
});


// Route for submition of create new URL form  : when it receives a POST request to /urls it responds with a redirection to /urls/:shortURL, where shortURL is the random string we generated.
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {};
  urlDatabase[shortURL].longURL = req.body.longURL;
  urlDatabase[shortURL].user_id = req.cookies["user_id"];
  let templateVars = { 
    user: users[req.cookies["user_id"]],
    shortURL: shortURL,
    longURL: urlDatabase[shortURL].longURL 
  };
  if (urlDatabase[shortURL]) {
    res.render("urls_show", templateVars);
  } else {
    res.render("404");
  }
  
});

//Add a POST route that removes a URL resource: POST /urls/:shortURL/delete
app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.cookies["user_id"]) {
    delete urlDatabase[req.params.shortURL];
    let templateVars = { 
      user: users[req.cookies["user_id"]],
      urls: urlsForUser(req.cookies["user_id"])
    };
    res.render("urls_index", templateVars);
  } else {
    res.send("You are not allowed to do this action\n");
  }
});

// Add a POST route that updates a URL resource; POST /urls/:id
app.post("/urls/:shortURL", (req, res) => {
  if (req.cookies["user_id"]) {
    let templateVars = { 
      user: users[req.cookies["user_id"]],
      shortURL: req.params.shortURL, 
      longURL: urlDatabase[req.params.shortURL].longURL
    };
    res.render("urls_show", templateVars);
  } else {
    res.send("You are not allowed to do this action\n");
  }
});

// Add an endpoint to handle a POST to /login 
app.post("/login", (req, res) => {
  let templateVars = { 
    user: users[req.cookies["user_id"]],
    urls : urlDatabase
  };

  res.redirect("urls");
});

// Add an endpoint to handle a POST to /logout 
app.post("/logout", (req, res) => {
  let templateVars = { 
    urls : urlDatabase
  };
  res.clearCookie('user_id');
  res.redirect("urls");
});

// the requests to the endpoint "/u/:shortURL" will redirect to its longURL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.render('404');
  }
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let templateVars = { 
    user: users[req.cookies["user_id"]],
    //urls: urlDatabase
    urls: urlsForUser(req.cookies["user_id"])
  };
  
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { 
    user: users[req.cookies["user_id"]]
  };
  if (req.cookies["user_id"]) {
    res.render("urls_new", templateVars);
  } else {
    res.render("login", templateVars);
  }
  
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = { 
    user: users[req.cookies["user_id"]],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL
  };
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
