"use strict"
const express = require("express"),
    router = express.Router(),
    books = require("google-books-search"),
    { ObjectID } = require("mongodb");

const User = require("../models/user"),
    Book = require("../models/books"),
    Request = require("../models/requests"),
    auth = require("../middleware/authenticated");

router.get("/profile", auth, (req, res) => {
    User.findById(req.user.id, { _id: 0, username: 1, photo: 1, fullName: 1, city: 1, state: 1 }).then((user) => {
        if (user) {
            res.render("user", { user });
        }
    });
});

const options = {
    field: 'title',
    limit: 15,
    type: 'books',
    order: 'relevance',
    lang: 'en'
};

router.post("/profile", auth, (req, res) => {
    let fullName = req.body.fullname;
    let city = req.body.city;
    let state = req.body.state;
    User.findByIdAndUpdate(req.user.id, { $set: { fullName, city, state } }, { _id: 0, username: 1, photo: 1, fullName: 1, city: 1, state: 1, new: true }).then((user) => {
        if (user) {
            req.flash("info", "Your personal data was updated with success");
            res.render("user", { user });
        }
    }).catch((e) => {
        console.log(e);
    })
});

router.get("/books", auth, (req, res) => {
    Book.find({ "owners.user_id": req.user.id }, { _id: 0, id: 1, title: 1, url: 1, image: 1, authors: 1, date: 1 }).then((books) => {
        if (books.length > 0) {
            res.render("mybooks", { books });
        } else {
            req.flash("info", "You have no books registed");
            res.render("mybooks");
        }
    });
});

router.get("/books/search/:term", auth, (req, res) => {
    let term = req.params.term;
    books.search(term, options, (error, results) => {
        if (!error) {
            if (results.length > 0) {
                let data = [];
                let bookIds = [];
                for (let i = 0; i < results.length; i++) {
                    if (results[i].publishedDate && results[i].authors) {
                        let date;
                        bookIds.push(results[i].id);
                        if (results[i].publishedDate.length > 4) {
                            date = results[i].publishedDate.slice(0, 4);
                        } else {
                            date = results[i].publishedDate;
                        }
                        if (results[i].authors.length > 0) {
                            results[i].authors = results[i].authors.join(", ");
                        }
                        console.log(results[i].thumbnail);
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
                Book.find({ id: { $in: bookIds }, "owners.user_id": req.user.id }, { _id: 0, id: 1 }).then((userBooks) => {
                    let booksArr = userBooks.map(ele => ele.id);
                    let filteredData = data.filter((ele) => {
                        return booksArr.indexOf(ele.id) === -1;
                    });
                    if (filteredData.length > 0) {
                        res.send(JSON.stringify(filteredData));
                    } else {
                        res.send(JSON.stringify({ message: "You own all the books with subject similar to the search" }));
                    }
                }).catch((e) => {
                    console.log(e);
                })
            } else {
                res.send(JSON.stringify({ error: "No books found based on your search" }));
            }
        } else {
            res.redirect("/books");
        }
    });
});

router.get("/books/add/:id", auth, (req, res) => {
    let id = req.params.id;
    books.search(id, (error, data) => {
        if (error || !data[0].publishedDate || !data[0].authors) {
            res.send(JSON.stringify({ error: "Something went wrong please try again later" }));
        } else if (data) {
            Book.findOne({ id: id }).then((book) => {
                if (book) {
                    Book.findOne({ id: id, "owners.user_id": req.user.id }).then((bookDoc) => {
                        if (bookDoc) {
                            res.send(JSON.stringify({ error: "You allready own the book" }));
                        } else {
                            return Book.findOneAndUpdate({ id: id },
                                {
                                    $push: {
                                        owners: {
                                            user_id: req.user.id,
                                            username: req.user.username
                                        }
                                    }
                                });
                        }
                    }).then((bookDoc) => {
                        if (data) {
                            res.send(JSON.stringify(bookDoc));
                        }
                    }).catch((e) => { console.log(e) });
                } else {
                    if (data[0].authors.length > 0) {
                        data[0].authors = data[0].authors.join(", ");
                    }
                    let date;
                    if (data[0].publishedDate.length > 4) {
                        date = data[0].publishedDate.slice(0, 4);
                    } else {
                        date = data[0].publishedDate;
                    }
                    let newBook = new Book({
                        id: id,
                        title: data[0].title,
                        authors: data[0].authors,
                        date: date,
                        url: data[0].link,
                        image: data[0].thumbnail,
                        owners: {
                            user_id: req.user.id,
                            username: req.user.username
                        }
                    }).save();
                    newBook.then((newDoc) => {
                        res.send(JSON.stringify(newDoc));
                    }).catch((e) => { console.log(e); });
                }
            }).catch((e) => {
                console.log(e);
            });
        }
    });
});

router.get("/books/remove/:id", auth, (req, res) => {
    let id = req.params.id;
    Book.findOne({ id, "owners.user_id": req.user.id }).then((data) => {
        if (data) {
            return Book.findOneAndUpdate({ id }, { $pull: { owners: { user_id: req.user.id } } }, { new: true });
        }
    }).then((doc) => {
        if (doc) {
            if (doc.owners.length === 0) {
                return Book.findOneAndRemove({ id });
            }
        }
    }).then((deletedDoc) => {
        return Request.remove(
            {
                $or: [{ "to": req.user.id, "book_id_requested": id },
                { "from.user_id": req.user.id, "book_id_selected": id }]
            });
    }).then((requestsDeleted) => {
        res.send(JSON.stringify({ message: "Book removed from your list with success" }));
    }).catch((e) => {
        console.log(e);
    })
});

router.get("/requests", auth, (req, res) => {
    let userRequests;
    let myRequests;
    let myBooks;
    Request.find({ to: req.user.id, state: true }).then((userReq) => {
        userRequests = userReq;
        if (userReq.length === 0) {
            req.flash("info", "You have no requests pending");
        }
        return Request.find({ "from.user_id": req.user.id });
    }).then((myReq) => {
        if (myReq.length === 0) {
            req.flash("info-2", "You have no requests pending");
        }
        myRequests = myReq;
        return Book.find({ "owners.user_id": req.user.id }, { _id: 0, id: 1, title: 1 }).sort({ title: 1 })
    }).then((booksDoc) => {
        if (booksDoc.length === 0) return;
        myBooks = booksDoc;
        return Request.find({ "from.user_id": req.user.id }, { _id: 0, book_id_requested: 1, book_id_selected: 1 });
    }).then((requestsDoc) => {
        let booksRequested = [];

        if (!requestsDoc) {
            res.render("requests", { userRequests, myRequests, myBooks });
        } else {
            requestsDoc.forEach((ele) => {
                if (ele.book_id_requested) {
                    booksRequested.push(ele.book_id_requested);
                }
                if (ele.book_id_selected) {
                    booksRequested.push(ele.book_id_selected);
                }
            });
            if (booksRequested.length === 0) return res.render("requests", { userRequests, myRequests, myBooks });
            if (booksRequested.length > 0) {
                let filteredData = myBooks.filter(ele => booksRequested.indexOf(ele.id) === -1);
                myBooks = filteredData;
                res.render("requests", { userRequests, myRequests, myBooks });
            }
        }
    }).catch((e) => {
        console.log(e);
    });
});

router.get("/requests/delete/:id", auth, (req, res) => {
    let id = req.params.id;
    Request.findOneAndRemove(id, "from.user_id").then((doc) => {
        if (doc) {
            res.send(JSON.stringify(doc));
        }
    }).catch((e) => {
        console.log(e);
    })
});

router.get("/requests/complete/:reqId/:bookId", auth, (req, res) => {
    let requestID = req.params.reqId;
    let bookID = req.params.bookId;
    Request.findOne({ "from.user_id": req.user.id, "book_id_selected": bookID }).then((doc) => {
        if (!doc) {
            return Request.findOne({ _id: ObjectID(requestID), "from.user_id": req.user.id });
        }
    }).then((reqDoc) => {
        if (reqDoc) {
            return Book.findOne({ id: bookID, "owners.user_id": req.user.id });
        }
    }).then((bookDoc) => {
        if (bookDoc) {
            return Request.findByIdAndUpdate(requestID,
                {
                    $set: {
                        "book_id_selected": bookDoc.id,
                        "book_img_selected": bookDoc.image,
                        "book_url_selected": bookDoc.url,
                        "book_title_selected": bookDoc.title,
                        state: true
                    }
                }, { new: true });
        }
    }).then((updatedDoc) => {
        res.send(JSON.stringify(updatedDoc));
    }).catch((e) => {
        console.log(e);
    });
});



router.get("/requests/accept/:id", auth, (req, res) => {
    let id = req.params.id;
    let requestData;
    let userInfo;
    let state = false;

    //CHECK IF REQUESTS EXISTS AND REMOVE
    Request.findOneAndRemove({ _id: ObjectID(id), to: req.user.id, state: true }).then((deletedRequest) => {
        if (deletedRequest) {
            requestData = deletedRequest;
            return User.findById(requestData.from.user_id, { _id: 1, username: 1 });
        }
        //CHECK IF AN USER IS RETURN
    }).then((userData) => {
        if (userData) {
            userInfo = userData;
            return Book.findOneAndUpdate({ id: requestData.book_id_requested, "owners.user_id": req.user.id },
                { $pull: { owners: { user_id: req.user.id } } });
        }
        //CHECK IF THE USER WAS PULLED FROM THE BOOK THAT WAS TRADED
    }).then((userRemovedOne) => {
        if (userRemovedOne) {
            return Book.findOneAndUpdate({ id: requestData.book_id_requested },
                { $push: { owners: { user_id: requestData.from.user_id, username: userInfo.username } } });
        }
        //CHECK IF THE NEW OWNER WAS PUSHED INTO THE BOOK THAT REQUESTED
    }).then((userPushOne) => {
        if (userPushOne) {
            return Book.findOneAndUpdate({id: requestData.book_id_selected,"owners.user_id": requestData.from.user_id},
            {$pull: { owners: { user_id: requestData.from.user_id }}});
        }
        //CHECK IF THE NEW OWNER WAS REMOVED FROM THE PREVIOUS BOOK OWNERS
    }).then((userRemoveTwo) => {
        if (userRemoveTwo) {
            return Book.findOneAndUpdate({ id: requestData.book_id_selected }, {
                $push: {
                    owners: { user_id: req.user.id, username: req.user.username }
                }
            });
        }
        //CHECK IF THE THE USER WHO ACCEPETED THE TRADE HAS THE NEW BOOK
    }).then((userPushTwo) => {
        if (userPushTwo) {
            state = true;
            return Request.remove({
                $or: [{ "from.user_id": req.user.id, "book_id_selected": requestData.book_id_requested},
                {"to": req.user.id, "book_id_requested": requestData.book_id_requested }]
            });
        }
        //CLEAN ALL THE REQUESTS ONE THE SAME BOOK FROM USER THAT ACCEPETED THE TRADE 
    }).then((deleteUserOne) => {
        return Request.remove({
            $or: [{ "from.user_id": requestData.from.user_id, "book_id_selected": requestData.book_id_selected},
            { "to": requestData.from.user_id,"book_id_requested": requestData.book_id_selected }]});
    }).then((deleteUserTwo) => {
        if (state) {
            res.send(JSON.stringify({message: "Trade completed, your can find your new book in the list"}));
        }
    }).catch((e) => {
        console.log(e);
    })
});

router.get("/requests/decline/:id", auth, (req, res) => {
    let id = req.params.id;
    Request.findOneAndRemove({_id:ObjectID(id),to:req.user.id,state:true}).then((doc)=>{
        if(doc){
            res.send(JSON.stringify({message: "The request was declined with success"}))
        }
    }).catch((e)=>{
        console.log(e);
    })
});

module.exports = router;
