const express = require('express');
const session = require('express-session');
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const collection = require('./config');
const { registration } = require("./config");

const app = express();
const port = 3000;

// Middleware to parse request body
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session middleware
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
}));

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Serve static files
app.use(express.static('public'));
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/img', express.static(__dirname + '/public/img'));
app.use('/js', express.static(__dirname + '/public/js'));

// Routes
app.get('/', (req, res) => {
  res.render('agri');
});

// Other routes...
// Routes
app.get('/', (req, res) => {
    res.render('agri');
  });
  app.get('/shop', (req, res) => {
    res.render('shop');
  });
  app.get('/about', (req, res) => {
    res.render('about');
  });
  app.get('/contact', (req, res) => {
    res.render('contact');
  });
  app.get('/account', (req, res) => {
    res.render('account');
  });
  app.get('/login', (req, res) => {
    res.render('login');
  });
  
  app.get('/register', (req, res) => {
    res.render('register');
  });
// Account route
app.get('/account', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.username) {
      return res.redirect('/login'); // Redirect to login if not logged in
    }

    // Find user by username in the database
    const user = await registration.findOne({ username: req.session.username });

    // Debugging: Check if user object is retrieved successfully
    console.log("User:", user);

    // If user does not exist, deny access
    if (!user) {
      return res.status(401).send("Invalid username or password");
    }

    // Render the account view with user data
    res.render("account", { user: user });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).send("Internal server error");
  }
});

// Other routes...
// Handle registration form submission
app.post('/register', async (req, res) => {
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const userData = {
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword
      };
      await collection.registration.create(userData);
      res.redirect('/login');
    } catch (error) {
      console.error('Error registering user:', error);
      res.redirect('/register');
    }
  });
  
  // Handle login form submission
  app.post('/login', async (req, res) => {
    const { username, password } = req.body;
  
    try {
      // Find user by username in the database
      const user = await collection.registration.findOne({ username });
  
      // If user does not exist, deny access
      if (!user) {
        return res.status(401).send('Invalid username or password');
      }
  
      // Compare submitted password with hashed password from the database
      const passwordMatch = await bcrypt.compare(password, user.password);
  
      // If passwords match, grant access
      if (passwordMatch) {
        return res.redirect('/account'); // Redirect to the user's dashboard
      } else {
        return res.status(401).send('Invalid username or password');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).send('Internal server error');
    }
  });
// Start server
app.listen(port, () => {
  console.info(`Server is running on port ${port}`);
});
