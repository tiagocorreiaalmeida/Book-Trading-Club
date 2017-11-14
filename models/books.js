const mongoose = require("mongoose");

const BookSchema = mongoose.Schema({
    book_id:{
        type: String,
        required:true
    },
    title:{
        type: String,
        required: true,
        trim: true
    },
    authors:{
        type:String,
        required:true,
        trim:true
    },
    date:{
        type: String,
        required: true
    },
    url:{
        type: String,
        trim: true
    },
    image:{
        type: String,
        trim: true
    },
    owners:{
        type:Array,
        default:[]
    }
});

const Book = mongoose.model("Book",BookSchema);
module.exports = Book;