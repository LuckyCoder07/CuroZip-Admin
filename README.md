# CuroZip Admin Panel

A comprehensive, full-stack logistics and courier management dashboard built on the MERN stack. CuroZip Admin provides super admins and hub managers the tools they need to track orders, manage fleet vendors, onboard delivery partners, and monitor real-time logistics analytics.

## 🚀 Features

- **Dynamic Dashboard**: Real-time analytics, revenue tracking, and status-based order distribution charts.
- **Hub & Branch Management**: Add, edit, and oversee regional delivery hubs.
- **Order Lifecycle Tracking**: Full tracking from 'Booked' to 'Delivered' with detailed timeline histories.
- **Vendor & Fleet Integration**: Manage intercity transport partners, routes, and vehicle types.
- **Role-Based Access Control (RBAC)**: Secure access tailored for Super Admins, Admins, Hub Managers, and Delivery Partners.
- **Modern UI/UX**: Fully responsive, mobile-optimized design featuring a seamless Light/Dark mode toggle and intuitive drawer-based interactions.

## 🛠 Tech Stack

**Frontend:**
- React (Vite)
- Tailwind CSS
- React Router DOM
- Recharts (for Analytics)
- Lucide React (Icons)
- Axios

**Backend:**
- Node.js & Express.js
- MongoDB & Mongoose
- JSON Web Tokens (JWT) for Authentication
- bcrypt.js for secure password hashing

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account (or local MongoDB)

### 1. Clone the repository
```bash
git clone https://github.com/LuckyCoder07/CuroZip-Admin.git
cd CuroZip-Admin
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory:
```env
MONGODB_TEST_URI=your_test_mongodb_uri
MONGODB_MAIN_URI=your_main_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=5000
```
Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
```
Start the Vite development server:
```bash
npm run dev
```

## 📦 Project Structure

```text
CuroZip-Admin/
├── backend/
│   ├── config/       # Database & environment configurations
│   ├── middleware/   # JWT Authentication & RBAC wrappers
│   ├── models/       # Mongoose Schemas (Order, Hub, User, Vendor, etc.)
│   ├── routes/       # Express API endpoints
│   └── server.js     # Entry point
└── frontend/
    ├── public/       # Static assets
    └── src/
        ├── components/ # Reusable UI components & Layouts
        ├── context/    # React Context (Auth, Theme, Toast)
        ├── pages/      # Route-level views (Dashboard, Orders, Hubs, etc.)
        └── App.jsx     # Main React application
```

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.
