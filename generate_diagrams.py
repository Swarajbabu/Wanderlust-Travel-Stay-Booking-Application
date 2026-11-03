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
ax.text(7, 88, "CLIENT TIER (Presentation Layer)", fontsize=9, fontweight='bold', color='black')
ax.text(50, 81, "Web Browser (HTML5 / Modern CSS3 / JavaScript ES6+ / Responsive Bootstrap)\nInteractive Mapbox GL JS Maps  |  Flatpickr Date-Range Calendar  |  Razorpay Checkout Modal", 
        ha='center', va='center', fontsize=8.5, color='black')

# Arrow Client -> Server
ax.annotate("", xy=(50, 65), xytext=(50, 75),
            arrowprops=dict(arrowstyle="<->", color="black", lw=1.2))
ax.text(52, 70, "HTTPS (REST API / HTML / JSON / Double-Submit CSRF)", fontsize=7.5, color='black')

# Tier 2: Application Tier
rect_server = patches.FancyBboxPatch((5, 34), 90, 31, boxstyle="square,pad=0.3",
                                     ec="black", fc="white", lw=1.5)
ax.add_patch(rect_server)
ax.text(7, 61, "APPLICATION TIER (Node.js & Express.js Engine)", fontsize=9, fontweight='bold', color='black')

# Sub-boxes in Server
# Middleware Pipeline
rect_mid = patches.Rectangle((8, 37), 25, 20, ec="black", fc="#f2f2f2", lw=1)
ax.add_patch(rect_mid)
ax.text(20.5, 54, "Security & Middleware", ha='center', fontsize=8, fontweight='bold', color='black')
ax.text(20.5, 45, "• Helmet CSP Security\n• csrf-csrf Cookie Shield\n• express-rate-limit\n• express-session (Mongo)\n• Winston & Morgan Logger", 
        ha='center', va='center', fontsize=7, color='black')

# Auth & Validation
rect_auth = patches.Rectangle((37, 37), 25, 20, ec="black", fc="#f2f2f2", lw=1)
ax.add_patch(rect_auth)
ax.text(49.5, 54, "Auth & Validation Gates", ha='center', fontsize=8, fontweight='bold', color='black')
ax.text(49.5, 45, "• Passport.js Local Strategy\n• Google OAuth 2.0 Auth\n• Bcrypt OTP Verification\n• Joi Schema Validators\n• Role Authorization (isOwner)", 
        ha='center', va='center', fontsize=7, color='black')

# Controllers & Models
rect_ctrl = patches.Rectangle((66, 37), 26, 20, ec="black", fc="#f2f2f2", lw=1)
ax.add_patch(rect_ctrl)
ax.text(79, 54, "Business Logic & ODM", ha='center', fontsize=8, fontweight='bold', color='black')
ax.text(79, 45, "• Listing & Review Ctrl\n• Booking Engine (Overlap)\n• Razorpay Crypto Verify\n• Mongoose ODM Models\n• Cascading Post Hooks", 
        ha='center', va='center', fontsize=7, color='black')

# Arrow Server -> Persistence & External
ax.annotate("", xy=(30, 22), xytext=(30, 34),
            arrowprops=dict(arrowstyle="<->", color="black", lw=1.2))
ax.text(32, 27, "Mongoose TCP Pool", fontsize=7.5, color='black')

ax.annotate("", xy=(75, 22), xytext=(75, 34),
            arrowprops=dict(arrowstyle="<->", color="black", lw=1.2))
ax.text(77, 27, "REST / Webhooks", fontsize=7.5, color='black')

# Tier 3: Persistence Tier (MongoDB Atlas)
rect_db = patches.FancyBboxPatch((5, 3), 50, 19, boxstyle="square,pad=0.3",
                                 ec="black", fc="#f8f8f8", lw=1.5)
ax.add_patch(rect_db)
ax.text(7, 18, "PERSISTENCE TIER (MongoDB Atlas NoSQL)", fontsize=8.5, fontweight='bold', color='black')
ax.text(30, 10, "3-Node Distributed Replica Set (Primary + 2 Secondaries)\nCollections: Users  |  Listings  |  Bookings  |  Reviews  |  Sessions\nText Search Index  |  2dsphere Geo Index  |  Compound Indexes", 
        ha='center', va='center', fontsize=7.5, color='black')

# External Services
rect_ext = patches.FancyBboxPatch((59, 3), 36, 19, boxstyle="square,pad=0.3",
                                  ec="black", fc="#f8f8f8", lw=1.5)
ax.add_patch(rect_ext)
ax.text(61, 18, "EXTERNAL CLOUD SERVICES", fontsize=8.5, fontweight='bold', color='black')
ax.text(77, 10, "• Cloudinary: Media CDN Storage\n• Mapbox API: Forward Geocoding\n• Razorpay: Payment Gateway\n• Nodemailer: Transactional SMTP", 
        ha='center', va='center', fontsize=7.5, color='black')

plt.tight_layout()
plt.savefig('report_assets/arch_system_3tier.png', dpi=300, facecolor='white')
plt.close()

# -------------------------------------------------------------
# 2. Database Schema ER & Document Architecture
# -------------------------------------------------------------
fig, ax = plt.subplots(figsize=(10, 6.4), dpi=300)
ax.set_xlim(0, 100)
ax.set_ylim(0, 100)
ax.axis('off')

ax.text(50, 96, "FIGURE 2: MONGODB ENTITY-RELATIONSHIP & DOCUMENT SCHEMA ARCHITECTURE", 
        ha='center', va='center', fontsize=11, fontweight='bold', color='black')

# Users Collection Box
rect_user = patches.Rectangle((5, 56), 26, 36, ec="black", fc="#fafafa", lw=1.2)
ax.add_patch(rect_user)
ax.text(18, 88.5, "Users Collection", ha='center', fontsize=9, fontweight='bold', color='black')
ax.plot([5, 31], [86, 86], color='black', lw=1)
user_fields = [
    "_id: ObjectId (PK)",
    "username: String",
    "email: String (Unique)",
    "hash: String (Salted)",
    "salt: String",
    "googleId: String (Sparse)",
    "authProvider: String",
    "emailVerified: Boolean",
    "otpHash: String",
    "otpExpiresAt: Date",
    "resetPasswordToken: Str"
]
for i, f in enumerate(user_fields):
    ax.text(6.5, 83 - i*2.4, f, fontsize=7.2, color='black')

# Listings Collection Box
rect_list = patches.Rectangle((37, 44), 28, 48, ec="black", fc="#fafafa", lw=1.2)
ax.add_patch(rect_list)
ax.text(51, 88.5, "Listings Collection", ha='center', fontsize=9, fontweight='bold', color='black')
ax.plot([37, 65], [86, 86], color='black', lw=1)
list_fields = [
    "_id: ObjectId (PK)",
    "title: String (Text Idx)",
    "description: String",
    "image: {url, filename}",
    "price: Number",
    "location: String (Text)",
    "country: String (Text)",
    "geometry: Point [lng,lat]",
    "category: Enum (17 Types)",
    "owner: ObjectId (Ref User)",
    "reviews: [ObjectId] (Ref)",
    "createdAt: Date"
]
for i, f in enumerate(list_fields):
    ax.text(38.5, 83 - i*2.4, f, fontsize=7.2, color='black')

# Reviews Collection Box
rect_rev = patches.Rectangle((71, 56), 24, 36, ec="black", fc="#fafafa", lw=1.2)
ax.add_patch(rect_rev)
ax.text(83, 88.5, "Reviews Collection", ha='center', fontsize=9, fontweight='bold', color='black')
ax.plot([71, 95], [86, 86], color='black', lw=1)
rev_fields = [
    "_id: ObjectId (PK)",
    "comment: String",
    "rating: Number (1-5)",
    "author: ObjectId (Ref User)",
    "createdAt: Date"
]
for i, f in enumerate(rev_fields):
    ax.text(72.5, 83 - i*2.4, f, fontsize=7.2, color='black')

# Bookings Collection Box
rect_book = patches.Rectangle((18, 5), 32, 35, ec="black", fc="#fafafa", lw=1.2)
ax.add_patch(rect_book)
ax.text(34, 36.5, "Bookings Collection", ha='center', fontsize=9, fontweight='bold', color='black')
ax.plot([18, 50], [34, 34], color='black', lw=1)
book_fields = [
    "_id: ObjectId (PK)",
    "listing: ObjectId (Ref Listing)",
    "guest: ObjectId (Ref User)",
    "checkIn: Date",
    "checkOut: Date",
    "guests: Number (min: 1)",
    "basePrice: Number",
    "taxAmount: Number (18% GST)",
    "totalPrice: Number",
    "status: pending|confirmed|cancelled",
    "paymentId: String (Razorpay)"
]
for i, f in enumerate(book_fields):
    ax.text(19.5, 31 - i*2.4, f, fontsize=7.2, color='black')

# Sessions Collection Box
rect_sess = patches.Rectangle((56, 5), 28, 35, ec="black", fc="#fafafa", lw=1.2)
ax.add_patch(rect_sess)
ax.text(70, 36.5, "Sessions (connect-mongo)", ha='center', fontsize=9, fontweight='bold', color='black')
ax.plot([56, 84], [34, 34], color='black', lw=1)
sess_fields = [
    "_id: String (Session ID)",
    "expires: Date (TTL Index)",
    "session: {",
    "  cookie: {...},",
    "  passport: { user: ID },",
    "  redirectUrl: String",
    "}",
    "lastModified: Date",
    "-- Auto Expired by Mongo --"
]
for i, f in enumerate(sess_fields):
    ax.text(57.5, 31 - i*2.4, f, fontsize=7.2, color='black')

# Relationship Arrows
# User -> Listing (1:N owns)
ax.annotate("1:N owns", xy=(37, 72), xytext=(31, 72),
            arrowprops=dict(arrowstyle="->", color="black", lw=1.2),
            fontsize=7, ha='center', va='bottom')

# Listing -> Review (1:N embedded refs)
ax.annotate("1:N refs", xy=(71, 72), xytext=(65, 72),
            arrowprops=dict(arrowstyle="->", color="black", lw=1.2),
            fontsize=7, ha='center', va='bottom')

# User -> Review (1:N authors)
ax.annotate("", xy=(77, 56), xytext=(25, 56),
            arrowprops=dict(arrowstyle="->", color="black", lw=1, linestyle="dotted"))
ax.text(51, 57, "1:N authors (User -> Review)", fontsize=7, ha='center', color='black')

# User -> Booking (1:N books)
ax.annotate("1:N guest", xy=(24, 40), xytext=(18, 56),
            arrowprops=dict(arrowstyle="->", color="black", lw=1.2),
            fontsize=7, ha='center', va='bottom')

# Listing -> Booking (1:N bookings)
ax.annotate("1:N reservations", xy=(42, 40), xytext=(45, 44),
            arrowprops=dict(arrowstyle="->", color="black", lw=1.2),
            fontsize=7, ha='center', va='bottom')

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

print("All 4 architectural diagrams successfully generated!")
