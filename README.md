# HomeMate

A mobile-focused Progressive Web App (PWA) for staff management, attendance tracking, and payroll management.

## 🚀 Features

- **User Authentication**: OTP-based login and password authentication
- **Staff Management**: Add, edit, and manage staff members
- **Attendance Tracking**: Calendar-based attendance logging
- **Payroll Management**: Track salaries, leaves, and payments
- **User Profile**: Manage personal information
- **Mobile-First Design**: Optimized for mobile devices

## 🛠️ Tech Stack

### Frontend
- React.js 18
- Vite
- React Router
- SCSS with CSS Modules
- Axios
- Vitest (Testing)

### Backend
- Node.js
- Express.js
- MongoDB (MongoDB Atlas)
- Mongoose
- JWT Authentication
- Jest (Testing)

## 📦 Installation

### Prerequisites
- Node.js >= 18.0.0
- MongoDB Atlas account (or local MongoDB)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/homemate.git
   cd homemate
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Configure environment variables**

   Create `backend/.env`:
   ```env
   MONGODB_URI=mongodb+srv://your-connection-string
   JWT_SECRET=your-secret-key
   PORT=5000
   ```

   Create `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000

## 🧪 Testing

### Frontend Tests
```bash
cd frontend
npm test
npm run test:coverage
```

### Backend Tests
```bash
cd backend
npm test
npm run test:coverage
```

## 📱 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy

1. **GitHub**: Push code to GitHub repository
2. **Vercel Frontend**: Import repository, set root to `frontend`
3. **Vercel Backend**: Create separate project, set root to `backend`
4. **Environment Variables**: Set in Vercel dashboard
5. **MongoDB Atlas**: Update network access settings

## 📁 Project Structure

```
homemate/
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── contexts/     # React contexts
│   │   ├── utils/        # Utility functions
│   │   └── App.jsx       # Main app component
│   ├── package.json
│   └── vite.config.js
├── backend/               # Node.js backend API
│   ├── routes/           # API routes
│   ├── models/          # MongoDB models
│   ├── services/        # Business logic
│   ├── middleware/      # Express middleware
│   ├── server.js        # Entry point
│   └── package.json
└── package.json         # Root package.json
```

## 🔐 Authentication

- **OTP Login**: Mobile number + OTP verification
- **Password Login**: Email + Password
- **JWT Tokens**: Secure token-based authentication

## 👥 Team

Developed by **Trinity Techiez**:
- Sonal
- Varun
- Nayan

## 📄 License

Private project - All rights reserved

## 🤝 Contributing

This is a private project. For issues or questions, please contact the development team.

## 📞 Support

For deployment assistance, refer to:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Full deployment guide
- [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) - Quick deployment checklist
