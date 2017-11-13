const  mongoose = require("mongoose");

const UserShema = mongoose.Schema({
    oauthID:{
        type: String,
        require:true
    },
    username:{
        type: String,
        required:true,
    },
    socialNetwork:{
        type: String,
        required: true
    },
    fullName:{
        type: String,
        trim: true,
        default: ""
    },
    city:{
        type: String,
        trim: true,
        default: ""
    },
    state:{
        type: String,
        trime: true,
        default: ""
    },
    photo:{
        type: String
    }
});

const User = mongoose.model("User",UserShema);
module.exports = User;