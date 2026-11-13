const Listing = require("../modals/listing");
const Booking = require("../modals/booking");

module.exports.renderDashboard = async (req, res) => {
    const listings = await Listing.find({ owner: req.user._id }).sort({ _id: -1 });
    const listingIds = listings.map((l) => l._id);

    const bookings = listingIds.length > 0
        ? await Booking.find({ listing: { $in: listingIds } })
            .populate("listing", "title location country price image")
            .populate("guest", "username")
            .sort({ createdAt: -1 })
        : [];

    const now = new Date();
    const pendingCount = bookings.filter((b) => b.status === "pending" && (!b.expiresAt || b.expiresAt > now)).length;
    const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
    const cancelledCount = bookings.filter((b) => b.status === "cancelled").length;
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + Number(b.totalPrice || 0), 0);

    res.render("host/dashboard.ejs", {
        listings,
        bookings,
        stats: {
            totalListings: listings.length,
            pendingCount,
            confirmedCount: confirmedBookings.length,
            cancelledCount,
            totalRevenue
        },
        title: "Host Dashboard"
    });
};
