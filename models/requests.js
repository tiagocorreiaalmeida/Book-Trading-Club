const mongoose = require("mongoose");

const RequestSchema = mongoose.Schema({
    book_id_requested:{
        type: String,
        required:true
    },
    book_img_requested:{
        type: String
    },
    book_url_requested:{
        type: String
    },
    book_title_requested:{
        type: String,
        required:true
    },
    book_id_selected:{
        type: String
    },
    book_img_selected:{
        type: String
    },
    book_url_selected:{
        type: String
    },
    book_title_selected:{
        type: String
    },
    from:{
        type: Object
    },
    to:{
        type: String
    },
    state:{
        type: Boolean,
        default:false
    }
});

const Request = mongoose.model("Request",RequestSchema);

module.exports= Request;