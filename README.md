# TurfSpot 🏟️

TurfSpot is a production-grade platform for turf booking and sports management. It unifies Users, Venue Owners, Coaches, and Admins into a single, seamless experience.

## 🚀 Key Features

### 👤 User Portal
- **Discovery**: Search and filter turfs by location, sport, and price.
- **Booking**: Real-time slot selection and secure payments via Razorpay.
- **Profiles**: Track bookings, manage reviews, and view public profiles.
- **Partnership**: Simple application process to become a Venue Owner.

### 🏢 Partner Hub (Owners, Coaches, Umpires)
- **Unified Dashboard**: View analytics, revenue, and booking trends.
- **Management**: Register and edit turfs, manage available slots, and respond to reviews.
- **Role-Based Access**: Specialized views for Venue Owners, Coaches, and Umpires.

### 🛡️ Admin Suite
- **Request Oversight**: Approve or reconsider owner registration requests.
- **User Management**: Monitor and manage all platform participants.
- **System Marketing**: Control landing page banners and video content.

---

## 🛠 Tech Stack
- **Frontend**: React (Vite), Redux Toolkit, Tailwind CSS, Axios.
- **Backend**: Node.js, Express, MongoDB (Mongoose), Zod.
- **Services**: Razorpay (Payments), Cloudinary (Images), Nodemailer (Emails).

---

## 📂 Documentation
- **[Architecture](ARCHITECTURE.md)**: Deep dive into the project's design and modular structure.
- **[Developer Guide](DEVELOPER_GUIDE.md)**: How to set up your environment and start contributing.
- **[API Reference](server/README.md)**: (Coming Soon) Detailed backend API documentation.

---

## 🚦 Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB (Local or Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-repo/TurfSpot.git
   cd TurfSpot
   ```

2. **Setup Backend**
   ```bash
   cd server
   npm install
   # Create .env based on example
   npm run server
   ```

3. **Setup Frontend**
   ```bash
   cd client/user
   npm install
   npm run dev
   ```

---

## 🤝 Contributing
Please read our **[Developer Guide](DEVELOPER_GUIDE.md)** before submitting a Pull Request. We follow a modular architecture and strict validation standards.

---
**TurfSpot - Book Your Game, Own Your Passion.**
