// IMPORT DEPENDENCIES
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { requireAuth, lrMiddleware , checkUser} = require("../middleware/authMiddleware");
const User = require("../models/users");
const Files = require("../models/userFiles");
const FormData = require('form-data');

// IPFS DEPENDENICIES
const multer  = require('multer');
const upload = multer({ dest: 'uploads/' });
const { create , globSource } = require('ipfs-http-client');
const fs = require('fs');
const path = require('path');
const { default: axios } = require("axios");

// USER ERRORS
let signinErrors = {};
let signupErrors = {};

// CONSTANTS & VARIABLES
const tokenAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
  return jwt.sign({ id }, "secret key", {
    expiresIn: tokenAge,
  });
};
 signupErrors['alreadyExists'] =""
signinErrors['userNotRegistered']=""
 signinErrors['incorrectPassword']=""

router.get('/',(req,res)=>{
  res.render('index')
})
// GET REQUESTS
// ==================================
// + SIGN IN
router.get("/signin",checkUser,(req, res) => {
  lrMiddleware(req, res, "signin");
  res.render("signin", { signupErrors,signinErrors ,user:res.locals.user});
});


// + DASHBOARD
router.get("/dashboard",requireAuth,checkUser,async (req, res) => {
    allFiles = await Files.find({'uploaded_by':res.locals.user.username}).then((files)=>{
        let userfiles = [];
        files.forEach((file)=>{
            userfiles.push(file);
        })
        return userfiles;
    });
  res.render("dashboard",{allFiles,user:res.locals.user});
});

// + SIGN OUT
router.get("/signout",checkUser, (req, res) => {
    res.cookie('jwt','',{maxAge:1});
    res.redirect('/signin')
});


// POST REQUESTS
// ==================================
// + SIGN IN
router.post("/signin",checkUser, async (req, res) => {
  let check = await User.findOne({ username: req.body.username });
  if (check != null) {
    if (req.body.password === check.password) {
      const token = createToken(check._id);
      res.cookie("jwt", token, { httpOnly: true, maxAge: tokenAge });
      res.redirect("/dashboard");
    } else {
      signinErrors['incorrectPassword']= "The Password you entered is Incorrect."
      signupErrors['alreadyExists'] =""
      signinErrors['userNotRegistered']=""
      res.render("signin", { signupErrors,signinErrors ,user:res.locals.user});
    }
  } else {
    signupErrors['alreadyExists'] =""
     signinErrors['incorrectPassword']=""
    signinErrors['userNotRegistered']= "Sorry! This user is not registered."
    res.render("signin", { signupErrors,signinErrors,user:res.locals.user });
  }
});

// + SIGN UP 
router.post("/signup",checkUser, (req, res) => {
  User.findOne({ username: req.body.username }).then((users) => {
    if (users) {
        signupErrors['alreadyExists']="This username is already registered."
        signinErrors['userNotRegistered']=""
         signinErrors['incorrectPassword']=""
        res.render('signin',{signupErrors,signinErrors,user:res.locals.user});
    } else {
      let data = new User({
        name: req.body.name,
        username: req.body.username,
        password: req.body.password,
      });
      User.create(data)
        .then(function (data) {
          const token = createToken(data._id);
          res.cookie("jwt", token, { httpOnly: true, maxAge: tokenAge });
          res.redirect('/dashboard')
        })
        .catch((err) => {
          signupErrors['alreadyExists'] =""
signinErrors['userNotRegistered']=""
 signinErrors['incorrectPassword']=""
            res.render('signin',{signupErrors,signinErrors,user:res.locals.user})
        });}
  });
});

// + DASHBOARD 
router.post('/dashboard',checkUser, upload.single('file'),async function(req, res, next){
    const name = res.locals.user.name
    let today = new Date().toLocaleString().replace(',','')
    const formData = new FormData();
formData.append('file', fs.createReadStream(req.file.path));
    const file = await axios.post("http://54.152.186.238:5001/api/v0/add", formData, {
      headers: formData.getHeaders(),
    });
    hash=file.data.Hash
    
    url='http://54.152.186.238:8080/ipfs/'+hash.toString();
    console.log(url)
    allFiles = await Files.find({'uploaded_by':res.locals.user.username}).then((files)=>{
            let userfiles = [];
            files.forEach((file)=>{
                userfiles.push(file);
            })
            return userfiles;
        });
    data={'name':req.file.originalname,'url':url,'format':req.file.mimetype,'date':today,'uploaded_by':res.locals.user.username,'size':req.file.size/1024,'name_of_user':res.locals.user.name}
    Files.create(data).then((data)=>{
        console.log('entered data successfully')
    })
    res.redirect(url)
})

// BACKEND --> FRONTENT 
//  signupErrors['alreadyExists'] 
// signinErrors['userNotRegistered']
//  signinErrors['incorrectPassword']
// allFiles

module.exports = router;
