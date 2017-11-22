const mongoose = require("mongoose");

mongoose.Promise= global.Promise;
mongoose.connect(process.env.DB_URL).then(()=>{
    console.log("Connected to DB");
}).catch((e)=>{
    console.log(`Error connecting to DB -> ${e}`);
});

module.exports = mongoose;
