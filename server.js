const express = require('express');
const app = express();
const pool = require('./db/pool');
const {body,validationResult} = require("express-validator");
const bcrypt = require('bcryptjs');

app.set("view engine","ejs");
app.use(express.urlencoded({extended:false}))

const PORT = process.env.PORT || 3000;

app.get('/',(req,res)=>{
  res.render('index');
})

app.get('/users/register',(req,res)=>{
  res.render('register', {errors:[]})
})

app.get('/users/login',(req,res)=>{
  res.render('login')
})

app.get('/users/dashboard',(req,res)=>{
  res.render('dashboard',{user: "Youssef"})
})

app.post('/users/register',[
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
  ],async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.render('register', {errors: errors.array()});
    }
    const {name,email,password1} = req.body;
    try {
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = await bcrypt.hash(password1,salt);
      await pool.query('INSERT INTO users (name,email,password) VALUES ($1,$2,$3)',[name,email,hashedPassword]);
      res.redirect('/users/login');
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  })

app.listen(PORT,()=>{
  console.log("Server Running");
})