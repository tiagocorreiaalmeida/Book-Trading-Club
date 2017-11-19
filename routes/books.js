"use strict";
const express = require("express"),
    router = express.Router();

const Book = require("../models/books"),
    User = require("../models/user"),
    Request = require("../models/requests");


router.get("/", (req, res) => {
    let books = [];
    Book.find({ "owners.user_id": { $ne: req.user.id } }).sort({ title: 1 }).then((booksDoc) => {
        if (booksDoc.length === 0) return;
        books = booksDoc;
        return Request.find({ "from.user_id": req.user.id }, { _id: 0, book_id_requested: 1 });
    }).then((data) => {
        if(!data) return res.render("books");
        let booksRequested = data.map(ele => ele.book_id_requested);
        if (booksRequested.length === 0) return res.render("books", { books });
        let filteredData = books.filter(ele => booksRequested.indexOf(ele.id) === -1);
        books = filteredData;
        res.render("books", { books });
    }).catch((e) => { console.log(e); });
});

router.get("/search/:name", (req, res) => {
    let input = req.params.name + "*";
    let books = [];
    Book.find({ title: { $regex: input, $options: 'i' }, "owners.user_id": { $ne: req.user.id } }).sort({ title: 1 }).then((booksDoc) => {
        if (booksDoc.length === 0) return;
        books = booksDoc;
        return Request.find({ "from.user_id": req.user.id }, { _id: 0, book_id_requested: 1 });
    }).then((data) => {
        if (!data) return res.send(JSON.stringify({ error: "No books found based on your search" }));
            let booksRequested = data.map(ele => ele.book_id_requested);
            if (booksRequested.length === 0) return res.send(JSON.stringify(books));
            let filteredData = books.filter(ele => booksRequested.indexOf(ele.id) === -1);
            res.send(JSON.stringify(filteredData));
    }).catch((e) => { console.log(e); });
});

router.get("/:book/:user", (req, res) => {
    let bookID = req.params.book;
    let userID = req.params.user;
    let book;
    if (bookID && userID) {
        if (userID === req.user.id) {
            res.send(JSON.stringify({ error: "You can't request your own books" }));
        }
        Book.findOne({ id: bookID, "owners.user_id": userID }).then((doc) => {
            if (!doc) res.send(JSON.stringify({ error: "Book not found" }));
            book = doc;
            return Request.find({ book_id_requested: bookID, "from.user_id": req.user.id });
        }).then((requestList) => {
            if (requestList.length > 0) res.send(JSON.stringify({ error: "You allready have a request on this book" }));
            return new Request({
                book_id_requested: bookID,
                book_img_requested: book.image,
                book_url_requested: book.url,
                book_title_requested: book.title,
                from: {
                    user_id: req.user.id,
                    user_username: req.user.username
                },
                to: userID
            }).save()
        }).then((newRequest) => {
            res.send(JSON.stringify({ message: "Request added, check your requests list to complete it!" }));
        }).catch((e) => { console.log(e); });
    }

});

module.exports = router;