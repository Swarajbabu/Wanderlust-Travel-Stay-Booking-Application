const express = require("express");
const router = express.Router({ mergeParams: true });               //For to use req.perams true mergeParams 

const wrapAsync = require("../utility/wrapAsync");                  // wrapErr
const { isLoggedIn, validateReview, isReviewAuthor } = require("../middleware.js");
const reviewController = require("../controllers/review.js");

//Reviews root Post
router.post("/", isLoggedIn, validateReview, wrapAsync(reviewController.createReview));

// Deleting the reviews
router.delete("/:reviewId", isLoggedIn, isReviewAuthor, wrapAsync(reviewController.destroyReview));


module.exports = router;
    