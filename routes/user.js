const express = require("express"),
    router = express.Router(),
    books = require("google-books-search");

const User = require("../models/user"),
    Book = require("../models/books"),
    auth = require("../middleware/authenticated");

router.get("/profile", auth, (req, res) => {
    User.findById(req.user.id, { _id: 0, username: 1, photo: 1, fullName: 1, city: 1, state: 1 }).then((user) => {
        if (user) {
            res.render("user", { user });
        }
    });
});

router.post("/profile", auth, (req, res) => {
    let fullName = req.body.fullname;
    let city = req.body.city;
    let state = req.body.state;
    User.findByIdAndUpdate(req.user.id, { $set: { fullName, city, state } }, { _id: 0, username: 1, photo: 1, fullName: 1, city: 1, state: 1, new: true }).then((user) => {
        if (user) {
            req.flash("info", "Your personal data was updated with success!");
            res.render("user", { user });
        }
    }).catch((e) => {
        console.log(e);
    })
});

router.get("/requests", auth, (req, res) => {
    res.render("requests");
});

router.get("/books", auth, (req, res) => {
   Book.find({owners:req.user.id},{_id:0, book_id:1, title:1, url:1, image:1, authors:1,date:1}).then((books)=>{
        if(books.length > 0){
            res.render("mybooks",{books});
        }else{
            req.flash("info","You have no books registed!");
            res.render("mybooks");
        }
    });
});

router.get("/books/search/:term", (req, res) => {
    let term = req.params.term;
    books.search(term,(error, results) => {
        if (!error) {
            if (results.length > 0) {
                let data = [];
                for (let i = 0; i < results.length; i++) {
                    if (results[i].publishedDate && results[i].authors) {
                        let date;
                        if (results[i].publishedDate.length > 4) {
                            date = results[i].publishedDate.slice(0, 4);
                        } else {
                            date = results[i].publishedDate;
                        }
                        if (results[i].authors.length > 0) {
                            results[i].authors = results[i].authors.join(", ");
                        }
                        data.push({
                            id: results[i].id,
                            title: results[i].title,
                            authors: results[i].authors,
                            date,
                            url: results[i].link,
                            image: results[i].thumbnail
                        });
                    }
                }
                res.send(JSON.stringify(data));
            } else {
                res.send(JSON.stringify({ error: "No books found based on your search" }));
            }
        } else {
            console.log(error);
            res.redirect("/books");
        }
    });
});

router.get("/books/add/:id", (req, res) => {
    let id = req.params.id;
    books.search(id,(error ,data) => {
        if(error || !data[0].publishedDate || !data[0].authors){
            res.send(JSON.stringify({ error: "Something went wrong please try again later!" }));
        }else if(data){
            Book.findOne({book_id:id}).then((book)=>{
                if(book){
                    Book.findOne({book_id:id,owners:req.user.id}).then((data)=>{
                        if(data) return;
                        return Book.update({book_id:id},{$push:{owners:req.user.id}});
                    })
                }else{
                    if (data[0].authors.length > 0) {
                        data[0].authors = data[0].authors.join(", ");
                    }
                    let date;
                    if (data[0].publishedDate.length > 4) {
                        date = data[0].publishedDate.slice(0, 4);
                    } else { 
                        date = data[0].publishedDate;
                    }
                   return new Book({
                    book_id:id,
                    title: data[0].title,
                    authors: data[0].authors,
                    date: date,
                    url: data[0].link,
                    image: data[0].thumbnail,
                    owners:[req.user.id]
                   }).save();
                }
            }).then((doc)=>{
                if(doc){
                    res.send(JSON.stringify(doc));
                }else{
                    res.send(JSON.stringify({error: "You allready own the book!" }));
                }
            }).catch((e)=>{
                console.log(e);
            })   
        }
    });
});

module.exports = router;