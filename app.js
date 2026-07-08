const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const ejsMate = require("ejs-mate");
const Listing = require("./modals/listing.js");
const methodOverride = require("method-override");

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

// To diaplay all the data
app.get("/listings", async (req, res) => {
    const allListings = await Listing.find({})
    res.render("listings/index.ejs", { allListings })
    // res.send("Working");
})

// New root
app.get("/listings/new", (req, res) => {
    res.render("listings/new.ejs");
});
app.post("/listings", async (req, res) => {
    const newListing = new Listing(req.body.listing);
    await newListing.save();
    console.log("Listing Saved");
    res.redirect("/listings");
});

// Show Route of perticular id
app.get("/listings/:id", async (req, res) => {
    const { id } = req.params;
    const listings = await Listing.findById(id);
    res.render("listings/show.ejs", { listings });
});

//Edit root
app.get("/listings/:id/edit", async (req, res) => {
    let { id } = req.params;
    const listings = await Listing.findById(id);
    res.render("listings/edit.ejs", { listings });
    // res.send("Working");
})
app.put("/listings/:id", async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    res.redirect(`/listings/${id}`);
});

// Delete root
app.delete("/listings/:id", async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    res.redirect("/listings");
});

app.listen(port, () => {
    console.log(`Server Started in: ${port}`)
});
