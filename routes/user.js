const express = require("express"),
    router = express.Router(),
    books = require("google-books-search");

const User = require("../models/user"),
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
    res.render("mybooks");
});

router.get("/books/search/:term", (req, res) => {
    let term = req.params.term;
    let options = {
        field: 'title',
        type: 'book',
        order: 'relevance',
        lang: 'en'
    }
    books.search(term, (error, results) => {
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
                res.send(JSON.stringify({ error: "No data found based on your search" }));
            }
        } else {
            console.log(error);
        }
    });
});

module.exports = router;