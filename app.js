const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const app = express();
let loggeduser = "";
///////////////////////////////////////////////////////////APP ROUTER////////////////////////////////////////////
app.set("view engine", "ejs");
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));
// mongoose.set('useNewUrlParser', true);
// mongoose.set('useFindAndModify', false);
// mongoose.set('useCreateIndex', true);
mongoose.connect("mongodb://localhost:27017/blogsite", {
  useNewUrlParser: true,
});
///////////////////////////////////////////////////////
app.use(
  session({
    secret: "This is my secret.",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

//////////////////////////////////////////////////////////MONGOOSE SCHEMA AND PASSPORT SESSIONS//////////////////////////
const blogschema = new mongoose.Schema({
  title: String,
  content: String,
  rating: Number,
  doupload: Date,
});
const idschema = new mongoose.Schema({
  email: String,
  password: String,
  blogs: [blogschema],
  name: String
});

idschema.plugin(passportLocalMongoose);

const ID = new mongoose.model("Id", idschema);

passport.use(ID.createStrategy());

passport.serializeUser(ID.serializeUser());
passport.deserializeUser(ID.deserializeUser());

/////////////////////////////////////////////////////////////////////GET REQUESTS////////////////////////////////////////

app.get("/", function (req, res) {
  let posts=[];
ID.find({},function(err,item){
  if(err){
    console.log(err);
  }
  else{
      //  console.log(item);
       posts.push.apply(posts,item[0].blogs);
       posts.push.apply(posts,item[1].blogs);

      res.render("home", { arr: posts });
  }
       
})
});

//--------------------------------------------------
app.get("/compose", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("compose");
  } else {
    res.redirect("/login");
  }
});

//----------------------------------------------------
app.get("/login", function (req, res) {
  if (req.isAuthenticated()) {
    res.redirect("profile");
  } else {
    res.render("login");
  }
});

//----------------------------------------------------
app.get("/register", function (req, res) {
  res.render("register");
});

//----------------------------------------------------
app.get("/logout", function (req, res) {
  loggeduser = "";
  req.logout();
  res.redirect("/");
});

//-----------------------------------------------
app.get("/profile", function (req, res) {
  if (req.isAuthenticated()) {
    // console.log(req.user);
    res.render("profile",{user:req.user.username,arr:req.user.blogs});
  } else {
    res.redirect("/register");
  }
});

////////////////////////////////////////////////////////////POST REQUESTS////////////////////////////////////

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/login",
  })
);

//-------------------------------------------------------------
app.post("/register", function (req, res) {
  ID.register({ username: req.body.username }, req.body.password, function (err,user){
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/profile");
      });
    }
  });
});
//----------------------------------------------------------------
app.post("/compose", function (req, res) {
  const newpost = {
    title: req.body.title,
    content: req.body.blog,
    rating: 0,
    doupload: new Date().getDate(),
  };
  ID.findOne({ username: loggeduser }, function (err, post) {
    console.log(post.blogs);
    post.blogs.push(newpost);
    post.save();
  });
  res.redirect("/profile");
});

/////////////////////////////////////////////////////////////////////////////////////////////
app.listen(3000, function (err) {
  if (err) {
    console.log(err);
  } else console.log("SERVER RUNNING @3000");
});
