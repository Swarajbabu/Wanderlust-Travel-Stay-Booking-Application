const express = require("express");
const app = express();
const cookieparser = require("cookie-parser");

app.use(cookieparser("secretcode"));   // we are define an secerate  

app.get("/signedcookies",(req,res)=>{
    res.cookie("made-in","india",{signed: true});   //Wher user cannt abel to edit it is sealed;
    res.send("Signed cookkie is send check you inspec");    // the value is s%3Aindia.O7jR6GKZb%2FpvO5OjHtuu0VFLxI%2BX8bcm3POhqzfV1G0 it user cant understand the value of it
}); 

app.get("/verify",(req,res)=>{
    console.log(req.cookies);               //It will access only unsigned cookies
    console.log(req.signedCookies);         //It only access only signed cookies
    res.send("Verified");
});

app.get("/getcookies", (req, res) => {
    res.cookie("username", "Swarajvecha");
    res.cookie("madein", "india");
    res.send("Sent you cookis");
});

app.get("/greet", (req, res) => {
    let { username } = req.cookies;
    res.send(`Hi welcome ${username}`);
});

app.get("/", (req, res) => {
    console.dir(req.cookies);
    res.send("Root Node");
});

app.listen(3000);
