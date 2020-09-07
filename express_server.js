const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const { getUserByEmail, generateRandomString, checkLogin } = require("./helpers");

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'week3day4',
  keys: ['my-secret-dont-tell']
}));


const bcrypt = require('bcrypt');

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "aJ48lW" },
  "9sm5xK": { longURL: "http://www.google.com",  userID: "aJ48lW" }
};

const users = {};

// Helpers
const urlsForUser = function(id) {
  const urls = {};
  if (id) {
    for (let url in urlDatabase) {
      if (id === urlDatabase[url].user_id) {
        urls[url] = urlDatabase[url];
      }
    }
  }
  return urls;
};


// Route for submisson of registeration form
app.post("/register", (req, res) => {
  let user = {};
  let error = {};
  if (!req.body.email || !req.body.password) {
    error["statusCode"] = 400;
    error["message"] = 'Fill all required fields';
    let templateVars = {
      user: users[req.session.user_id],
      error: error
    };
    res.render("errors", templateVars);
  } else {
    if (getUserByEmail(req.body.email, users)) {
      error["statusCode"] = 400;
      error["message"] = 'Email already exists';
      let templateVars = {
        user: users[req.session.user_id],
        error: error
      };
      res.render("errors", templateVars);
    } else {
      user["id"] = generateRandomString();
      user["email"] = req.body.email;
      user["password"] = bcrypt.hashSync(req.body.password, 10);
      users[user["id"]] = user;

      req.session.user_id = user["id"];
      let templateVars = { urls: urlsForUser(req.session.user_id), user: user };
      
      res.render("urls_index", templateVars);
    }
  }
});

// Route for submition of login form
app.post("/login", (req, res) => {
  let error = {};
  if (!req.body.email || !req.body.password) {
    error["statusCode"] = 400;
    error["message"] = 'Fill all required fields';
    let templateVars = {
      user: users[req.session.user_id],
      error: error
    };
    res.render("errors", templateVars);
  } else {
    let user = getUserByEmail(req.body.email, users);
    if (!user) {
      error["statusCode"] = 403;
      error["message"] = 'E-mail cannot be found';
      let templateVars = {
        user: users[req.session.user_id],
        error: error
      };
      res.render("errors", templateVars);
    } else {
      if (bcrypt.compareSync(req.body.password, user.password)) {
        req.session.user_id = user["id"];
        let templateVars = {
          user: users[req.session.user_id],
          urls: urlsForUser(req.session.user_id)
        };
        
        res.render("urls_index", templateVars);
      } else {
        let error = {};
        error["statusCode"] = 403;
        error["message"] = 'Check your Login/Password';
        let templateVars = {
          user: users[req.session.user_id],
          error: error
        };
        res.render("errors", templateVars);
      }
    }
  }
});


app.get("/", (req, res) => {
  if (checkLogin(req.session.user_id)) {
    let templateVars = {
      user: users[req.session.user_id],
      urls: urlsForUser(req.session.user_id)
    };
    
    res.render("urls_index", templateVars);
  } else {
    let templateVars = { urls: urlDatabase, user: users[req.session.user_id] };
    res.render("login", templateVars);
  }
});

// Route to render register form
app.get("/register", (req, res) => {
  if (checkLogin(req.session.user_id)) {
    let templateVars = {
      user: users[req.session.user_id],
      urls: urlsForUser(req.session.user_id)
    };
    res.render("urls_index", templateVars);
  } else {
    let templateVars = { urls: urlDatabase, user: users[req.session.user_id] };
    res.render("register", templateVars);
  }
});

// Route to render login form
app.get("/login", (req, res) => {
  if (checkLogin(req.session.user_id)) {
    let templateVars = {
      user: users[req.session.user_id],
      urls: urlsForUser(req.session.user_id)
    };
    res.render("urls_index", templateVars);
  } else {
    let templateVars = { urls: urlDatabase, user: users[req.session.user_id] };
    res.render("login", templateVars);
  }
});


// Route for submition of create new URL form  : when it receives a POST request to /urls it responds with a redirection to /urls/:shortURL, where shortURL is the random string we generated.
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {};
  urlDatabase[shortURL].longURL = req.body.longURL;
  urlDatabase[shortURL].user_id = req.session.user_id;
  let templateVars = {
    user: users[req.session.user_id],
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
  if (checkLogin(req.session.user_id)) {
    delete urlDatabase[req.params.shortURL];
    let templateVars = {
      user: users[req.session.user_id],
      urls: urlsForUser(req.session.user_id)
    };
    res.render("urls_index", templateVars);
  } else {
    let error = {};
    error["statusCode"] = 403;
    error["message"] = 'You are not allowed to do this action';
    let templateVars = {
      user: users[req.session.user_id],
      error: error
    };
    res.render("errors", templateVars);
  }
});

// Add a POST route that updates a URL resource; POST /urls/:id
app.post("/urls/:shortURL", (req, res) => {
  if (checkLogin(req.session.user_id)) {
    if (req.body.newLongURL) {
      urlDatabase[req.params.shortURL].longURL = req.body.newLongURL;
    }
    let templateVars = {
      user: users[req.session.user_id],
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL
    };
    res.render("urls_show", templateVars);
  } else {
    let error = {};
    error["statusCode"] = 403;
    error["message"] = 'You are not allowed to do this action';
    let templateVars = {
      user: users[req.session.user_id],
      error: error
    };
    res.render("errors", templateVars);
  }
});


// Add an endpoint to handle a POST to /logout
app.post("/logout", (req, res) => {
  req.session = null;
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

app.get("/urls", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id],
    urls: urlsForUser(req.session.user_id)
  };
  
  if (checkLogin(req.session.user_id)) {
    res.render("urls_index", templateVars);
  } else {
    res.render("login", templateVars);
  }
  
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id],
  };
  if (checkLogin(req.session.user_id)) {
    res.render("urls_new", templateVars);
  } else {
    res.render("login", templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] && req.session.user_id === urlDatabase[req.params.shortURL].user_id) {
    if (urlDatabase[req.params.shortURL]) {
      let templateVars = {
        user: users[req.session.user_id],
        shortURL: req.params.shortURL,
        longURL: urlDatabase[req.params.shortURL].longURL
      };
      res.render("urls_show", templateVars);
    } else {
      let error = {};
      error["statusCode"] = 400;
      error["message"] = 'URL for the given ID does not exist';
      let templateVars = {
        user: users[req.session.user_id],
        error: error
      };
      res.render("errors", templateVars);
    }
  } else {
    let error = {};
    error["statusCode"] = 400;
    error["message"] = 'Access denied';
    let templateVars = {
      user: users[req.session.user_id],
      error: error
    };
    res.render("errors", templateVars);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});