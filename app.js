const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const ejsMate = require("ejs-mate");                                         // EJS mate layout 
const methodOverride = require("method-override");                           // Override HTTP methods like PUT,PATCH and DELETE
const session = require("express-session");                                  // Session is used to store data in the form of cookie
const flash = require("connect-flash");                                      // Flash is used to store data in the form of cookie and dispaly only one message
const cookieParser = require("cookie-parser");                               // Cookie parser is used to parse the cookie from the request

// Authantaction and authoration
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./modals/user.js");

// const Listing = require("./modals/listing.js");                              // Listing modal schema for store data
// const Review = require("./modals/review.js");                                // Review modal schema for store data
const ExpressError = require("./utility/ExpressError.js");                   // Custom Error Class     
// const wrapAsync = require("./utility/wrapAsync.js");                         // Async Handler same work like try catch block 
// const { ListingSchema, reviewSchema } = require("./schema.js");              // Joi schema validation it work for validating that we send a valid data 

const router_listing = require("./routes/listing.js");
const router_reviews = require("./routes/review.js");
const router_user = require("./routes/user.js");

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"))
app.engine("ejs", ejsMate);

let port = 8080;
let mongodb_url = 'mongodb://127.0.0.1/wanderlust';

mongoose.connect(mongodb_url)
    .then((res) => {
        console.log("Connected");
    }).catch((err) => {
        console.log(err);
    });

app.get("/", (req, res) => {
    res.send("I am root")
});

const SessionOptions = {
    secret: "mysupersecretkey",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    }
};

app.use(session(SessionOptions));
app.use(flash());

// Aut and Aou
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/demouser",async(req,res)=>{
    const newuser = new User({
        email: "swarajvecha@gmail.com",
        username: "swarajvecha"
    });

    let registeredUser = await User.register(newuser,"Swaraj@2005");
    res.send(registeredUser);
})

app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
})

app.use("/listings",router_listing);                            
app.use("/listings/:id/reviews",router_reviews);
app.use("/",router_user);

// 404 error handling for all the request.
app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found"));
})

// error handling for all the request.
app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something Went Wrong" } = err;
    res.status(statusCode).render("error.ejs", { err });
    // res.status(statusCode).send(message);
});

app.listen(port, () => {
    console.log(`Server Started in: ${port}`)
});





