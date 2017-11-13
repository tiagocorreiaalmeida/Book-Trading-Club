const FacebookStrategy = require("passport-facebook"),
      TwitterStrategy = require("passport-twitter"),
      GithubStrategy = require("passport-github"),
      moment = require("moment");

const User = require("../models/user");

module.exports = (passport) => {
    passport.use(new FacebookStrategy({
        clientID: process.env.FB_ID,
        clientSecret: process.env.FB_SECRET,
        callbackURL: "http://localhost:3000/auth/facebook/callback",
        profileFields: ["id", "displayName", "photos"]
    }, (accessToken, refreshToken, profile, done) => {
        User.findOne({ oauthID: profile.id, socialNetwork: "facebook" }).then((user) => {
            if (user) return user;
            return new User({
                oauthID: profile.id.toString(),
                username: profile.displayName,
                socialNetwork: "facebook",
                photo: profile.photos[0].value,
                createdAt: moment().valueOf()
            }).save()
        }).then(user => done(null, user))
            .catch(e => done(e));
    }));

    passport.use(new GithubStrategy({
        clientID: process.env.GIT_ID,
        clientSecret: process.env.GIT_SECRET,
        callbackURL: "http://localhost:3000/auth/github/callback"
    }, (accessToken, refreshToken, profile, done) => {
        User.findOne({ oauthID: profile.id, socialNetwork: "github" }).then((user) => {
            if (user) return user;
            return new User({
                oauthID: profile.id.toString(),
                username: profile.username,
                socialNetwork: "github",
                photo: profile.photos[0].value,
                createdAt: moment().valueOf()
            }).save()
        }).then(user => done(null, user))
            .catch(e => done(e));
    }));

        
    passport.use(new TwitterStrategy({
        consumerKey: process.env.TWITTER_ID,
        consumerSecret: process.env.TWITTER_SECRET,
        callbackURL:"http://127.0.0.1:3000/auth/twitter/callback"
    },(accessToken ,refreshToken, profile, done)=>{
        User.findOne({oauthID:profile.id}).then((user)=>{
            if(user) return user;
             return new User({
                oauthID:profile.id.toString(),
                username:profile.username,
                socialNetwork: "twitter",
                photo:profile.photos[0].value,
                createdAt:moment().format("Do MMMM YYYY")
            }).save()
        }).then((user)=>done(null,user))
        .catch((e)=>done(e));
    }
    ));

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
        User.findById(id).then(data => done(null, data))
            .catch((e) => {
                console.log(e);
            });
    });
}