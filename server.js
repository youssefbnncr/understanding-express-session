const express = require('express');
const app = express();
const pool = require('./db/pool');
const {body,validationResult} = require("express-validator");
const bcrypt = require('bcryptjs');
const session = require("express-session");
const flash = require("express-flash")
app.set("view engine","ejs");
const passport = require('passport');
app.use(express.urlencoded({extended:false}))
const LocalStrategy = require("passport-local").Strategy;

const PORT = process.env.PORT || 3000;

app.use(session({
  secret: 'secretKey',
  resave: false,
  saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

passport.use(new LocalStrategy(
  {usernameField: 'email'}, async(email, password, done) => {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1',[email])
    if(userResult.rows.length === 0){
      return done(null,false,{message: "No user found with that email"});
    }
    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password,user.password);

    if(!isMatch){
      return done(null,false,{message: "Incorrect password"})
    }

    return done(null,user);
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (userResult.rows.length > 0) {
      done(null, userResult.rows[0]);
    } else {
      done(null, false);
    }
  }
);


app.get('/',(req,res)=>{
  res.render('index');
})

app.get('/users/register',(req,res)=>{
  res.render('register', {errors:[]})
})

app.get('/users/login',(req,res)=>{
  res.render('login');
})

app.get('/users/dashboard', isAuthenticated, (req, res) => {
  if (!req.user) {
    return res.redirect('/users/login');
  }
  res.render('dashboard', { user: req.user });
});


app.post('/users/register', [
  body('name')
    .trim()
    .matches(/^[A-Za-z\s]+$/)
    .withMessage('Name should not contain numbers.'),
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address.'),
  body('password1')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.'),
  body('password2')
    .custom((value, { req }) => value === req.body.password1)
    .withMessage('Passwords do not match.')
], async (req, res) => {
  const errors = validationResult(req);
  const { name, email, password1 } = req.body;

  if (!errors.isEmpty()) {
    return res.render('register', { errors: errors.array() });
  }

  try {
    const emailCheckResult = await pool.query('SELECT email FROM users WHERE email = $1', [email]);

    if (emailCheckResult.rows.length > 0) {
      return res.render('register', { errors: [{ msg: 'Email is already registered.' }] });
    } else {
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = await bcrypt.hash(password1, salt);
      await pool.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3)', [name, email, hashedPassword]);
      req.flash("suceess_registed", "Please log in");
      res.redirect('/users/login');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.post('/users/login', passport.authenticate('local', {
  successRedirect: '/users/dashboard',
  failureRedirect: '/users/login',
  failureFlash: true
}), (req, res) => {
  console.log("User is authenticated: ", req.isAuthenticated());
  res.redirect('/users/dashboard');
});


app.get('/users/logout', (req, res) => {
  req.logout(() => {
    req.flash('success_msg', 'You have logged out');
    res.redirect('/users/login');
  });
});

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/users/login');
}


app.listen(PORT,()=>{
  console.log("Server Running");
})