const express = require('express');
const app = express();

app.set("view engine","ejs");
const PORT = process.env.PORT || 3000;

app.get('/',(req,res)=>{
  res.render('index');
})

app.get('/users/register',(req,res)=>{
  res.render('register')
})

app.get('/users/login',(req,res)=>{
  res.render('login')
})

app.get('/users/dashboard',(req,res)=>{
  res.render('dashboard',{user: "Youssef"})
})
app.listen(PORT,()=>{
  console.log("Server Running");
})