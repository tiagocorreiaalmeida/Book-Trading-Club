const express = require("express"),
    router = express.Router();

const Book = require("../models/books"),
    User = require("../models/user"),
    Request = require("../models/requests");


router.get("/",(req,res)=>{
    Book.find().sort({title:1}).then((books)=>{
        res.render("books",{books});
    });
});

router.get("/:book/:user",(req,res)=>{
    let bookID = req.params.book;
    let userID = req.params.user;
    if(userID === req.user.id){
        res.send(JSON.stringify({error:"You can't request your own books"}));
    }
    Book.findOne({id:bookID,"owners.user_id":userID}).then((doc)=>{
        if(!doc) res.send(JSON.stringify({error:"Book not found"}));
        return new Request({
            book_id:bookID,
            book_img:doc.image,
            book_url:doc.url,
            from:{
                user_id:req.user.id,
                user_username:req.user.username
            },
            to: userID,
            state: false
        }).save()
    }).then((newRequest)=>{
        res.send(JSON.stringify({message: "Request added, check your requests list to complete it!"}));
    }).catch((e)=>{console.log(e);});
});

module.exports = router;