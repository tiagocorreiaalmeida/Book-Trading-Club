const express = require("express");
const hbs = require("hbs");

const app = express();

app.use(express.static(__dirname+"/public"));

app.set("views",__dirname+"/views");   
app.set("view engine","hbs");

hbs.registerPartials(__dirname+"/views/partials");

app.get("/",(req,res)=>{
    res.render("index");
});

app.get("/profile",(req,res)=>{
    res.render("user");
});

app.use((req,res)=>{
    res.render("404");
});

app.listen(3000,()=>{
    console.log("Running on port 3000");
})