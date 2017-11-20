const express = require("express"),
    router = express.Router(),
    books = require("google-books-search");

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

router.get("/books/search/:term", (req, res) => {
    let term = req.params.term;
    books.search(term,options, (error, results) => {
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
            console.log(error);
            res.redirect("/books");
        }
    });
});

router.get("/books/add/:id", (req, res) => {
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
                    var newBook = new Book({
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

router.get("/books/remove/:id", (req, res) => {
    let id = req.params.id;
    Book.findOne({ id }).then((data) => {
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
            {$or:[{"to":req.user.id,"book_id_requested":id},
            {"from.user_id":req.user.id,"book_id_selected":id}]});
    }).then((requestsDeleted)=>{
        res.send(JSON.stringify({ message: "Book removed from your list with success" }));
    }).catch((e) => {
        console.log(e);
    })
});

router.get("/requests", auth, (req, res) => {
    let userRequests;
    let myRequests;
    let myBooks;
    Request.find({to:req.user.id,state:true}).then((userReq)=>{
        userRequests = userReq;
        if(userReq.length === 0){
            req.flash("info", "You have no requests pending");
        }
        return Request.find({"from.user_id":req.user.id});
    }).then((myReq)=>{
        if(myReq.length === 0){
            req.flash("info-2", "You have no requests pending");
        }
        myRequests = myReq;
        return Book.find({ "owners.user_id": req.user.id },{_id:0, id:1,title:1}).sort({ title: 1 })
    }).then((booksDoc)=>{
        if (booksDoc.length === 0) return;
        myBooks = booksDoc;
        return Request.find({ $or:[{"from.user_id": req.user.id}, {"to":req.user.id}]}, { _id: 0, book_id_requested: 1, book_id_selected:1 });
    }).then((requestsDoc)=>{
        let booksRequested = [];

        if(!requestsDoc){
            res.render("requests",{userRequests,myRequests, myBooks});
        }else{
            requestsDoc.forEach((ele) =>{
                if(ele.book_id_requested){
                    booksRequested.push(ele.book_id_requested);
                }
                if(ele.book_id_selected){
                    booksRequested.push(ele.book_id_selected);
                }
            });
            if (booksRequested.length === 0) return res.render("requests",{userRequests,myRequests,myBooks});
            if(booksRequested.length > 0){
                let filteredData = myBooks.filter(ele => booksRequested.indexOf(ele.id) === -1);
                myBooks = filteredData;
                res.render("requests",{userRequests,myRequests,myBooks});
            }
        }
    }).catch((e)=>{
        console.log(e);
    });
});

router.get("/requests/delete/:id",(req,res)=>{
    let id = req.params.id;
    Request.findByIdAndRemove(id).then((doc)=>{
        if(doc){
            res.send(JSON.stringify({message: "Deleted with success"}));
        }
    }).catch((e)=>{
        console.log(e);
    })
});

router.get("/requests/complete/:id",(req,res)=>{
    let id = req.params.id;
    Request.findById(id).then((doc)=>{

    });
});

module.exports = router;