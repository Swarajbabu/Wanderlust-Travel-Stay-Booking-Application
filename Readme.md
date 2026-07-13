# 🏡 Wanderlust — Travel Stay Booking Application

A full-stack vacation rental booking platform inspired by Airbnb, built with **Node.js**, **Express.js**, **MongoDB**, and **EJS**. Wanderlust lets users browse property listings, view details, and (as features roll out) leave reviews, sign up/log in, and upload images.

> 🚧 **Status: Work in Progress**
> This project is under active development as part of my full-stack learning journey. Core listing functionality works; authentication, reviews, and image uploads are being built out incrementally. Expect frequent changes, incomplete features, and refactors.

---

## ✨ Features

**Working / In Progress**
- [x] Property listing CRUD (create, view, edit, delete)
- [x] Server-side rendering with EJS + ejs-mate layouts
- [x] Schema validation using Joi
- [x] RESTful routing with method-override for PUT/DELETE from forms
- [ ] User authentication & authorization (signup/login/sessions)
- [ ] Reviews & ratings on listings
- [ ] Image upload support (Cloudinary/Multer integration)
- [ ] Responsive UI polish across devices
- [ ] Search & filter listings

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB with Mongoose |
| Templating | EJS + ejs-mate |
| Validation | Joi |
| Dev Tooling | Nodemon |

---

## 📁 Project Structure

```
Wanderlust-Travel-Stay-Booking-Application/
├── init/          # Database seeding scripts
├── modals/        # Mongoose schemas/models (listings, etc.)
├── public/         # Static assets (CSS, client-side JS, images)
├── utility/        # Helper functions, error handling utilities
├── views/          # EJS templates and partials
├── app.js          # Main application entry point
├── schema.js       # Joi validation schemas
├── package.json
└── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [MongoDB](https://www.mongodb.com/) running locally or a MongoDB Atlas URI

### Installation

```bash
# Clone the repository
git clone https://github.com/Swarajbabu/Wanderlust-Travel-Stay-Booking-Application.git

# Move into the project directory
cd Wanderlust-Travel-Stay-Booking-Application

# Install dependencies
npm install
```

### Environment Setup
Create a `.env` file in the root directory (if not present) with your MongoDB connection string:

```
ATLASDB_URL=your_mongodb_connection_string
```

### Seed the Database (optional)
```bash
node init/index.js
```

### Run the App
```bash
nodemon app.js
```

The app should now be running locally — check the console output for the port (commonly `http://localhost:8080` for Express apps of this kind).

---

## 🗺️ Roadmap

- [ ] Add Passport.js-based authentication
- [ ] Enable image uploads via Cloudinary
- [ ] Add review & rating system for listings
- [ ] Improve mobile responsiveness
- [ ] Add search, filters, and category browsing
- [ ] Deploy to a live hosting platform

---

## 🤝 Contributing

This is primarily a personal learning project, but suggestions, issues, and pull requests are welcome. Feel free to open an issue if you spot a bug or have an idea.

---

## 📄 License

This project is licensed under the ISC License.

---

## 👤 Author

**Swaraj**
- GitHub: [@Swarajbabu](https://github.com/Swarajbabu)
- Portfolio: [swarajvecha.in](https://swarajvecha.in)