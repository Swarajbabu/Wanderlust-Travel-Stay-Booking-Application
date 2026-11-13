import matplotlib.pyplot as plt
import matplotlib.patches as patches
import os

os.makedirs('report_assets', exist_ok=True)

# Common styling: strictly black, white, and subtle grays (monochrome only)
plt.rcParams['font.sans-serif'] = 'Arial'
plt.rcParams['font.family'] = 'sans-serif'

# -------------------------------------------------------------
# 1. System Architecture (3-Tier + External APIs)
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(10, 6.2), dpi=300)
ax.set_xlim(0, 100)
ax.set_ylim(0, 100)
ax.axis('off')

# Title
ax.text(50, 96, "FIGURE 1: THREE-TIER SYSTEM ARCHITECTURE & PERSISTENCE PIPELINE", 
        ha='center', va='center', fontsize=11, fontweight='bold', color='black')

# Tier 1: Client Tier
rect_client = patches.FancyBboxPatch((5, 75), 90, 16, boxstyle="square,pad=0.3",
                                    ec="black", fc="#f8f8f8", lw=1.5)
ax.add_patch(rect_client)
ax.text(7, 88, "CLIENT TIER (Presentation Layer - HTML5 / EJS-Mate / Bootstrap 5 / JS ES6+)", fontsize=8.5, fontweight='bold', color='black')
ax.text(50, 81, "Explore Listing Feed  |  Interactive Mapbox GL Maps  |  Flatpickr Date-Range Calendar  |  Razorpay Checkout Modal\nContextual AI Chatbot Drawer (Gemini)  |  Cascading Location Filter  |  Host Analytics Dashboard  |  Room Share Portal", 
        ha='center', va='center', fontsize=7.8, color='black')

# Arrow Client -> Server
ax.annotate("", xy=(50, 65), xytext=(50, 75),
            arrowprops=dict(arrowstyle="<->", color="black", lw=1.2))
ax.text(52, 70, "HTTPS (RESTful Endpoints / EJS Render / JSON APIs / Double-Submit CSRF)", fontsize=7.5, color='black')

# Tier 2: Application Tier
rect_server = patches.FancyBboxPatch((5, 34), 90, 31, boxstyle="square,pad=0.3",
                                     ec="black", fc="white", lw=1.5)
ax.add_patch(rect_server)
ax.text(7, 61, "APPLICATION TIER (Node.js & Express.js Multi-Module Architecture)", fontsize=8.5, fontweight='bold', color='black')

# Sub-boxes in Server
# Middleware Pipeline
rect_mid = patches.Rectangle((7, 37), 21, 20, ec="black", fc="#f2f2f2", lw=1)
ax.add_patch(rect_mid)
ax.text(17.5, 54, "Security & Gateway", ha='center', fontsize=7.8, fontweight='bold', color='black')
ax.text(17.5, 45, "• Helmet CSP Directives\n• csrf-csrf Token Shield\n• express-rate-limit\n• express-session (Mongo)\n• Winston / Morgan Logger", 
        ha='center', va='center', fontsize=6.8, color='black')

# Auth & Validation
rect_auth = patches.Rectangle((30, 37), 21, 20, ec="black", fc="#f2f2f2", lw=1)
ax.add_patch(rect_auth)
ax.text(40.5, 54, "Auth & Access Control", ha='center', fontsize=7.8, fontweight='bold', color='black')
ax.text(40.5, 45, "• Passport Local (Salt/Hash)\n• Google OAuth 2.0 Linking\n• Bcrypt OTP Verification\n• Joi Object Schema Gates\n• RBAC (User/Host/Admin)", 
        ha='center', va='center', fontsize=6.8, color='black')

# Core Stay & Booking Logic
rect_stay = patches.Rectangle((53, 37), 20, 20, ec="black", fc="#f2f2f2", lw=1)
ax.add_patch(rect_stay)
ax.text(63, 54, "Stays & Financials", ha='center', fontsize=7.8, fontweight='bold', color='black')
ax.text(63, 45, "• Listings & Reviews Ctrl\n• Concurrency Lock Engine\n• Razorpay HMAC Verify\n• Host Revenue Analytics\n• Cancellation & Refunds", 
        ha='center', va='center', fontsize=6.8, color='black')

# AI & Smart Services
rect_ai = patches.Rectangle((75, 37), 18, 20, ec="black", fc="#f2f2f2", lw=1)
ax.add_patch(rect_ai)
ax.text(84, 54, "AI & Smart Match", ha='center', fontsize=7.8, fontweight='bold', color='black')
ax.text(84, 45, "• Gemini AI Travel Bot\n• Itinerary Generator\n• Curated Catalog Fallback\n• RoomShare Pool Matching\n• Compatibility Scorer", 
        ha='center', va='center', fontsize=6.8, color='black')

# Arrow Server -> Persistence & External
ax.annotate("", xy=(28, 22), xytext=(28, 34),
            arrowprops=dict(arrowstyle="<->", color="black", lw=1.2))
ax.text(30, 27, "Mongoose ODM TCP Pool", fontsize=7.2, color='black')

ax.annotate("", xy=(75, 22), xytext=(75, 34),
            arrowprops=dict(arrowstyle="<->", color="black", lw=1.2))
ax.text(77, 27, "REST APIs & Webhooks", fontsize=7.2, color='black')

# Tier 3: Persistence Tier (MongoDB Atlas)
rect_db = patches.FancyBboxPatch((5, 3), 48, 19, boxstyle="square,pad=0.3",
                                 ec="black", fc="#f8f8f8", lw=1.5)
ax.add_patch(rect_db)
ax.text(7, 18, "PERSISTENCE TIER (MongoDB Atlas Cloud Cluster)", fontsize=8, fontweight='bold', color='black')
ax.text(29, 10, "3-Node Replica Set: Users | Listings | Bookings | Reviews | RoomShares | Itineraries\nCompound Indexes  |  Text Search Index  |  2dsphere Geo Index  |  Session Store", 
        ha='center', va='center', fontsize=7, color='black')

# External Services
rect_ext = patches.FancyBboxPatch((55, 3), 40, 19, boxstyle="square,pad=0.3",
                                  ec="black", fc="#f8f8f8", lw=1.5)
ax.add_patch(rect_ext)
ax.text(57, 18, "EXTERNAL CLOUD SERVICES & APIS", fontsize=8, fontweight='bold', color='black')
ax.text(75, 10, "• Cloudinary: Media CDN Storage  |  Mapbox: Forward Geocoding & Tiles\n• Razorpay: Payment Orders & Webhooks  |  Nodemailer: SMTP OTP Mails\n• Google Gemini AI: Generative Assistant & Structured JSON Itineraries", 
        ha='center', va='center', fontsize=6.8, color='black')

plt.tight_layout()
plt.savefig('report_assets/arch_system_3tier.png', dpi=300, facecolor='white')
plt.close()

# -------------------------------------------------------------
# 2. Database Schema ER & Document Architecture (6 Collections)
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(10, 6.8), dpi=300)
ax.set_xlim(0, 100)
ax.set_ylim(0, 100)
ax.axis('off')

ax.text(50, 97, "FIGURE 2: MONGODB ENTITY-RELATIONSHIP & DOCUMENT SCHEMA ARCHITECTURE", 
        ha='center', va='center', fontsize=11, fontweight='bold', color='black')

# Row 1: Users, Listings, Reviews
# Users Collection Box
rect_user = patches.Rectangle((3, 53), 29, 39, ec="black", fc="#fafafa", lw=1.2)
ax.add_patch(rect_user)
ax.text(17.5, 89, "Users Collection", ha='center', fontsize=8.5, fontweight='bold', color='black')
ax.plot([3, 32], [86.5, 86.5], color='black', lw=1)
user_fields = [
    "_id: ObjectId (PK)",
    "username: String",
    "email: String (Unique)",
    "role: user | host | admin",
    "hash, salt: (PBKDF2/Bcrypt)",
    "googleId: String (Sparse)",
    "authProvider: local | google",
    "emailVerified: Boolean",
    "otpHash, otpExpiresAt: Date",
    "wishlist: [ObjectId] (Ref)",
    "travelProfile: {gender, style...}"
]
for i, f in enumerate(user_fields):
    ax.text(4.5, 83.5 - i*2.6, f, fontsize=6.8, color='black')

# Listings Collection Box
rect_list = patches.Rectangle((35.5, 53), 30, 39, ec="black", fc="#fafafa", lw=1.2)
ax.add_patch(rect_list)
ax.text(50.5, 89, "Listings Collection", ha='center', fontsize=8.5, fontweight='bold', color='black')
ax.plot([35.5, 65.5], [86.5, 86.5], color='black', lw=1)
list_fields = [
    "_id: ObjectId (PK)",
    "title: String (Text Index)",
    "price: Number (Price Index)",
    "location, country: (Text Index)",
    "geometry: Point [lng, lat] (2dsphere)",
    "category: Enum (17 Types)",
    "owner: ObjectId (Ref User)",
    "reviews: [ObjectId] (Ref)",
    "allowRoomSharing: Boolean",
    "amenities: [String]",
    "maxGuests, bedrooms, bathrooms"
]
for i, f in enumerate(list_fields):
    ax.text(37, 83.5 - i*2.6, f, fontsize=6.8, color='black')

# Reviews Collection Box
rect_rev = patches.Rectangle((69, 61), 28, 31, ec="black", fc="#fafafa", lw=1.2)
ax.add_patch(rect_rev)
ax.text(83, 89, "Reviews Collection", ha='center', fontsize=8.5, fontweight='bold', color='black')
ax.plot([69, 97], [86.5, 86.5], color='black', lw=1)
rev_fields = [
    "_id: ObjectId (PK)",
    "comment: String",
    "rating: Number (1-5)",
    "author: ObjectId (Ref User)",
    "createdAt: Date"
]
for i, f in enumerate(rev_fields):
    ax.text(70.5, 83.5 - i*3.2, f, fontsize=6.8, color='black')

# Row 2: Bookings, RoomSharePools, TripItineraries
# Bookings Collection Box
rect_book = patches.Rectangle((3, 5), 29, 43, ec="black", fc="#fafafa", lw=1.2)
ax.add_patch(rect_book)
ax.text(17.5, 45, "Bookings Collection", ha='center', fontsize=8.5, fontweight='bold', color='black')
ax.plot([3, 32], [42.5, 42.5], color='black', lw=1)
book_fields = [
    "_id: ObjectId (PK)",
    "listing: ObjectId (Ref Listing)",
    "guest: ObjectId (Ref User)",
    "checkIn, checkOut: Date",
    "guests: Number (min: 1)",
    "basePrice, taxAmount, totalPrice",
    "status: pending|confirmed|cancelled",
    "paymentId, razorpayOrderId",
    "isSharedBooking: Boolean",
    "roomSharePool: ObjectId (Ref)",
    "refundStatus, refundAmount, refundId"
]
for i, f in enumerate(book_fields):
    ax.text(4.5, 39.5 - i*2.6, f, fontsize=6.8, color='black')

# RoomSharePools Collection Box
rect_pool = patches.Rectangle((35.5, 5), 30, 43, ec="black", fc="#fafafa", lw=1.2)
ax.add_patch(rect_pool)
ax.text(50.5, 45, "RoomSharePools Collection", ha='center', fontsize=8.5, fontweight='bold', color='black')
ax.plot([35.5, 65.5], [42.5, 42.5], color='black', lw=1)
pool_fields = [
    "_id: ObjectId (PK)",
    "listing: ObjectId (Ref Listing)",
    "initiator: ObjectId (Ref User)",
    "checkIn, checkOut: Date",
    "targetMembers, currentMembers",
    "totalPrice, pricePerPerson",
    "status: open|locked|confirmed...",
    "participants: [{user, status...}]",
    "preferences: {gender, budget...}",
    "messages: [{sender, text, time}]",
    "booking: ObjectId (Ref Booking)"
]
for i, f in enumerate(pool_fields):
    ax.text(37, 39.5 - i*2.6, f, fontsize=6.8, color='black')

# TripItineraries Collection Box
rect_itin = patches.Rectangle((69, 5), 28, 43, ec="black", fc="#fafafa", lw=1.2)
ax.add_patch(rect_itin)
ax.text(83, 45, "TripItineraries Collection", ha='center', fontsize=8.5, fontweight='bold', color='black')
ax.plot([69, 97], [42.5, 42.5], color='black', lw=1)
itin_fields = [
    "_id: ObjectId (PK)",
    "user: ObjectId (Ref User)",
    "listing: ObjectId (Ref Listing)",
    "destination: String",
    "days: Number (1-14)",
    "pace: relaxed | balanced | packed",
    "travelMode: driving|walking|transit",
    "sourceProvider: gemini | fallback",
    "totalDistanceKm, totalTravelMins",
    "dayPlans: [{dayNum, stops...}]",
    "createdAt: Date"
]
for i, f in enumerate(itin_fields):
    ax.text(70.5, 39.5 - i*2.6, f, fontsize=6.8, color='black')

# Relationships
# Users -> Listings (1:N owns)
ax.annotate("1:N owns", xy=(35.5, 74), xytext=(32, 74),
            arrowprops=dict(arrowstyle="->", color="black", lw=1.1),
            fontsize=6.8, ha='center', va='bottom')

# Listings -> Reviews (1:N ref)
ax.annotate("1:N refs", xy=(69, 74), xytext=(65.5, 74),
            arrowprops=dict(arrowstyle="->", color="black", lw=1.1),
            fontsize=6.8, ha='center', va='bottom')

# Users -> Bookings (1:N guest)
ax.annotate("1:N guest", xy=(17.5, 48), xytext=(17.5, 53),
            arrowprops=dict(arrowstyle="->", color="black", lw=1.1),
            fontsize=6.8, ha='center', va='bottom')

# Listings -> Bookings (1:N stays)
ax.annotate("1:N stays", xy=(32, 30), xytext=(35.5, 55),
            arrowprops=dict(arrowstyle="->", color="black", lw=1.1),
            fontsize=6.8, ha='center', va='bottom')

# Listings -> RoomShares (1:N pools)
ax.annotate("1:N pools", xy=(50.5, 48), xytext=(50.5, 53),
            arrowprops=dict(arrowstyle="->", color="black", lw=1.1),
            fontsize=6.8, ha='center', va='bottom')

# RoomShares -> Bookings (1:1 confirmed)
ax.annotate("1:1 converts", xy=(32, 22), xytext=(35.5, 22),
            arrowprops=dict(arrowstyle="->", color="black", lw=1.1),
            fontsize=6.8, ha='center', va='bottom')

# Users -> TripItineraries (1:N plans)
ax.annotate("1:N plans", xy=(83, 48), xytext=(78, 55),
            arrowprops=dict(arrowstyle="->", color="black", lw=1.1, linestyle="--"),
            fontsize=6.8, ha='center', va='bottom')

plt.tight_layout()
plt.savefig('report_assets/arch_schema_er.png', dpi=300, facecolor='white')
plt.close()

# -------------------------------------------------------------
# 3. MongoDB Atlas 3-Node Replica Set Cluster
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(10, 5.8), dpi=300)
ax.set_xlim(0, 100)
ax.set_ylim(0, 100)
ax.axis('off')

ax.text(50, 95, "FIGURE 3: MONGODB ATLAS DISTRIBUTED 3-NODE REPLICA SET ARCHITECTURE", 
        ha='center', va='center', fontsize=11, fontweight='bold', color='black')

# Node.js Client Box
rect_app = patches.Rectangle((35, 75), 30, 14, ec="black", fc="#f2f2f2", lw=1.3)
ax.add_patch(rect_app)
ax.text(50, 84, "Node.js Application Server", ha='center', fontsize=9, fontweight='bold', color='black')
ax.text(50, 78, "Mongoose ODM Driver Connection Pool\n(TCP Re-usable Keep-Alive Sockets)", 
        ha='center', fontsize=7.5, color='black')

# Cluster Container
rect_cluster = patches.FancyBboxPatch((5, 8), 90, 58, boxstyle="square,pad=0.3",
                                      ec="black", fc="white", lw=1.5, linestyle="--")
ax.add_patch(rect_cluster)
ax.text(7, 62, "MONGODB ATLAS CLOUD REPLICA SET (CLUSTER M0 / M10)", fontsize=8.5, fontweight='bold', color='black')

# Primary Node
rect_pri = patches.Rectangle((10, 15), 24, 42, ec="black", fc="#f8f8f8", lw=1.4)
ax.add_patch(rect_pri)
ax.text(22, 53, "PRIMARY NODE", ha='center', fontsize=9, fontweight='bold', color='black')
ax.text(22, 49, "(Active Write Target)", ha='center', fontsize=7.5, fontstyle='italic', color='black')
ax.plot([10, 34], [46, 46], color='black', lw=1)
ax.text(22, 34, "• Receives All Writes\n• Default Read Target\n• Maintains Local Oplog\n  (oplog.rs)\n• WiredTiger Storage\n• In-Memory Cache\n• Automatic Checkpoints", 
        ha='center', va='center', fontsize=7.5, color='black')

# Secondary Node 1
rect_sec1 = patches.Rectangle((38, 15), 24, 42, ec="black", fc="#f8f8f8", lw=1.4)
ax.add_patch(rect_sec1)
ax.text(50, 53, "SECONDARY NODE 1", ha='center', fontsize=9, fontweight='bold', color='black')
ax.text(50, 49, "(Read Replica)", ha='center', fontsize=7.5, fontstyle='italic', color='black')
ax.plot([38, 62], [46, 46], color='black', lw=1)
ax.text(50, 34, "• Asynchronous Sync\n• Continuous Oplog Replay\n• Read Preference Support\n• Redundant Data Copy\n• Automatic Failover\n  Candidate", 
        ha='center', va='center', fontsize=7.5, color='black')

# Secondary Node 2
rect_sec2 = patches.Rectangle((66, 15), 24, 42, ec="black", fc="#f8f8f8", lw=1.4)
ax.add_patch(rect_sec2)
ax.text(78, 53, "SECONDARY NODE 2", ha='center', fontsize=9, fontweight='bold', color='black')
ax.text(78, 49, "(High Availability & Quorum)", ha='center', fontsize=7.5, fontstyle='italic', color='black')
ax.plot([66, 90], [46, 46], color='black', lw=1)
ax.text(78, 34, "• Asynchronous Sync\n• Participates in Elections\n• Provides Majority Quorum\n• Geographic Redundancy\n• Zero-Downtime Patching", 
        ha='center', va='center', fontsize=7.5, color='black')

# Driver connection arrow
ax.annotate("", xy=(22, 57), xytext=(40, 75),
            arrowprops=dict(arrowstyle="->", color="black", lw=1.2))
ax.text(25, 68, "Writes / Strong Reads", fontsize=7.5, color='black')

# Oplog sync arrows
ax.annotate("", xy=(38, 35), xytext=(34, 35),
            arrowprops=dict(arrowstyle="->", color="black", lw=1.2))
ax.text(36, 37, "Oplog", fontsize=7, ha='center', color='black')

ax.annotate("", xy=(66, 35), xytext=(62, 35),
            arrowprops=dict(arrowstyle="->", color="black", lw=1.2))
ax.text(64, 37, "Oplog", fontsize=7, ha='center', color='black')

# Heartbeat bidirectional arrows
ax.annotate("", xy=(50, 18), xytext=(22, 18),
            arrowprops=dict(arrowstyle="<->", color="black", lw=1, linestyle="--"))
ax.annotate("", xy=(78, 18), xytext=(50, 18),
            arrowprops=dict(arrowstyle="<->", color="black", lw=1, linestyle="--"))
ax.text(50, 12, "Continuous Heartbeat & Election Protocol (2s Interval)", ha='center', fontsize=7, color='black')

plt.tight_layout()
plt.savefig('report_assets/arch_replica_set.png', dpi=300, facecolor='white')
plt.close()

# -------------------------------------------------------------
# 4. Booking Concurrency & Cryptographic Verification Sequence
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(10, 6.2), dpi=300)
ax.set_xlim(0, 100)
ax.set_ylim(0, 100)
ax.axis('off')

ax.text(50, 96, "FIGURE 4: DOUBLE-BOOKING PREVENTION & PAYMENT VERIFICATION SEQUENCE FLOW", 
        ha='center', va='center', fontsize=11, fontweight='bold', color='black')

# Lifeline headers
actors = [
    ("Guest Client", 12),
    ("Express Server", 37),
    ("MongoDB Atlas", 63),
    ("Razorpay Gateway", 88)
]

for name, x in actors:
    rect = patches.Rectangle((x-10, 86), 20, 7, ec="black", fc="#f2f2f2", lw=1.2)
    ax.add_patch(rect)
    ax.text(x, 89.5, name, ha='center', va='center', fontsize=8, fontweight='bold', color='black')
    ax.plot([x, x], [86, 6], color='black', lw=0.8, linestyle=":")

# Sequence Steps
steps = [
    (1, 12, 37, 78, "1. POST /listings/:id/bookings (checkIn, checkOut, guests)", "->"),
    (2, 37, 63, 70, "2. findOne({listing, status: {$in: ['pending','confirmed']}, checkIn: {$lt: reqOut}, checkOut: {$gt: reqIn}})", "->"),
    (3, 63, 37, 62, "3. Return null (No overlap detected; dates available)", "-->"),
    (4, 37, 37, 55, "4. Server computes: totalPrice = (nights * price) + 18% GST (Client price ignored)", "self"),
    (5, 37, 63, 48, "5. new Booking({ status: 'pending', totalPrice, ... }).save()", "->"),
    (6, 37, 88, 41, "6. razorpay.orders.create({ amount: totalPrice * 100, currency: 'INR' })", "->"),
    (7, 88, 37, 34, "7. Return order_id & payment token", "-->"),
    (8, 37, 12, 27, "8. Render Checkout Modal with Razorpay SDK & order_id", "-->"),
    (9, 12, 37, 20, "9. POST /verify-payment (order_id, payment_id, razorpay_signature)", "->"),
    (10, 37, 37, 14, "10. HMAC-SHA256(order_id + '|' + payment_id, SECRET) == razorpay_signature", "self"),
    (11, 37, 63, 8, "11. Booking.findByIdAndUpdate(id, { status: 'confirmed', paymentId })", "->")
]

for idx, x1, x2, y, text, style in steps:
    if style == "self":
        ax.annotate("", xy=(x1+8, y-2), xytext=(x1, y+2),
                    arrowprops=dict(arrowstyle="->", color="black", lw=1))
        ax.text(x1+9, y, text, fontsize=7.2, va='center', color='black', fontweight='bold')
    elif style == "-->":
        ax.annotate("", xy=(x2, y), xytext=(x1, y),
                    arrowprops=dict(arrowstyle="->", color="black", lw=1, linestyle="--"))
        ax.text((x1+x2)/2, y+1.5, text, fontsize=7, ha='center', va='bottom', color='black')
    else:
        ax.annotate("", xy=(x2, y), xytext=(x1, y),
                    arrowprops=dict(arrowstyle="->", color="black", lw=1))
        ax.text((x1+x2)/2, y+1.5, text, fontsize=7, ha='center', va='bottom', color='black')

plt.tight_layout()
plt.savefig('report_assets/arch_booking_sequence.png', dpi=300, facecolor='white')
plt.close()

print("All 4 architectural diagrams successfully regenerated with 6 collections and expanded architecture!")
