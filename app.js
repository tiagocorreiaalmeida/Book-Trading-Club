require("dotenv").config();
const express = require("express");
const hbs = require("hbs");
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);

const passportConfig = require("./controllers/passport");
const mongoose = require("./config/mongoose");
const user = require("./routes/user");

passportConfig(passport);

const app = express();

app.use(express.static(__dirname+"/public"));

app.set("views",__dirname+"/views");   
app.set("view engine","hbs");

hbs.registerPartials(__dirname+"/views/partials");

app.use(session({
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:false,
    store: new MongoStore({
        mongooseConnection:mongoose.connection
    })
}));

app.use(passport.initialize());
app.use(passport.session());
app.use((req,res,next)=>{
    res.locals.isAuthenticated = req.isAuthenticated();
    next();
})


app.get("/auth/facebook",passport.authenticate("facebook"));
app.get("/auth/facebook/callback",passport.authenticate("facebook",{failureRedirect:"/"}),(req,res)=>{
    res.redirect("/");
});

app.get("/auth/github",passport.authenticate("github"));
app.get("/auth/github/callback",passport.authenticate("github",{failureRedirect:"/"}),(req,res)=>{
    res.redirect("/");
});

app.get("/auth/twitter",passport.authenticate("twitter"));
app.get("/auth/twitter/callback",passport.authenticate("twitter",{failureRedirect:"/"}),(req,res)=>{
    res.redirect("/");
});

app.get("/",(req,res)=>{
    res.render("index");
});

app.use("/user",user);

app.get("/books",(req,res)=>{
    res.render("books");
});

app.get("/logout",(req,res)=>{
    req.logOut();
    req.session.destroy();
    res.redirect("/");
})

app.use((req,res)=>{
    res.render("404");
});

app.listen(3000,()=>{
    console.log("Running on port 3000");
})