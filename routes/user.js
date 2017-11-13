const express = require("express"),
      router = express.Router();

const User = require("../models/user"),
      auth = require("../middleware/authenticated"); 

router.get("/profile",auth,(req,res)=>{
    User.findById(req.user.id,{_id:0,username:1,photo:1,fullName:1,city:1,state:1}).then((user)=>{
        if(user){
            res.render("user",{user});
        }
    });
});

router.post("/profile",auth,(req,res)=>{
    let fullName = req.body.fullname;
    let city = req.body.city;
    let state = req.body.state;
    User.findByIdAndUpdate(req.user.id,{$set:{fullName,city,state}},{_id:0,username:1,photo:1,fullName:1,city:1,state:1,new:true}).then((user)=>{
        if(user){
            req.flash("info","Your personal data was updated with success!");
            res.render("user",{user});
        }
    }).catch((e)=>{
        console.log(e);
    })
});

router.get("/requests",auth,(req,res)=>{
    res.render("requests");
});

router.get("/books",auth,(req,res)=>{
    res.render("mybooks");
});

module.exports = router;