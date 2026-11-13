const express = require("express");
const router = express.Router();
const wrapAsync = require("../utility/wrapAsync");
const {
    isLoggedIn,
    isEmailVerified,
    validateRoomShare,
    validateRoomShareJoin,
    validateRoomShareSelectStay
} = require("../middleware.js");
const roomShareController = require("../controllers/roomShare.js");

router.get("/room-shares", wrapAsync(roomShareController.listRoomShares));
router.post("/room-shares", isLoggedIn, isEmailVerified, validateRoomShare, wrapAsync(roomShareController.createPoolFromHub));

router.get("/listings/:id/room-shares/new", isLoggedIn, isEmailVerified, wrapAsync(roomShareController.renderCreatePool));
router.post("/listings/:id/room-shares", isLoggedIn, isEmailVerified, validateRoomShare, wrapAsync(roomShareController.createPool));

router.get("/room-shares/:poolId", wrapAsync(roomShareController.showPool));
router.post("/room-shares/:poolId/select-stay", isLoggedIn, isEmailVerified, validateRoomShareSelectStay, wrapAsync(roomShareController.selectStayForPool));
router.post("/room-shares/:poolId/join", isLoggedIn, isEmailVerified, validateRoomShareJoin, wrapAsync(roomShareController.requestJoin));
router.patch("/room-shares/:poolId/participants/:participantId", isLoggedIn, wrapAsync(roomShareController.updateParticipantStatus));
router.post("/room-shares/:poolId/lock", isLoggedIn, wrapAsync(roomShareController.lockPool));
router.get("/room-shares/:poolId/checkout", isLoggedIn, wrapAsync(roomShareController.renderPoolCheckout));
router.post("/room-shares/:poolId/verify-payment", isLoggedIn, wrapAsync(roomShareController.verifyPoolPayment));
router.patch("/room-shares/:poolId/cancel", isLoggedIn, wrapAsync(roomShareController.cancelPool));
router.get("/room-shares/:poolId/messages", isLoggedIn, wrapAsync(roomShareController.getMessagesJson));
router.post("/room-shares/:poolId/messages", isLoggedIn, wrapAsync(roomShareController.postMessage));

module.exports = router;
