const mongoose = require("mongoose");

const RequestSchema = mongoose.Schema({
    book_id:{
        type: String,
        required:true
    },
    book_img:{

    },
    book_url:{

    },
    from:{
        type: Object
    },
    to:{
        type: String
    },
    state:{
        type: Boolean,
        default:0
    }
});

const Request = mongoose.model("Request",RequestSchema);

module.exports= Request;