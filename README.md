# HealthLink - Basic e-Clinic & Triage System

A full-stack web application that enables patients to perform symptom triage, book appointments, and consult doctors online.

## 🎯 Features

- **Authentication**: JWT-based with roles (Patient, Doctor, Admin)
- **Patient Dashboard**: Profile management, symptom triage, appointment booking
- **Doctor Dashboard**: Appointment management, triage reports, patient communication
- **Admin Dashboard**: User management, statistics, system monitoring
- **Triage System**: AI-based symptom analysis with conditional advice

## 🛠 Tech Stack

- **Frontend**: React.js + TailwindCSS
- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT + bcrypt
- **State Management**: Redux Toolkit

## 📁 Project Structure

```
healthlink/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── redux/         # State management
│   │   └── utils/         # Utility functions
├── server/                # Express backend
│   ├── models/           # MongoDB schemas
│   ├── controllers/      # Route controllers
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   └── config/           # Configuration files
└── package.json          # Root package.json
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm run install-all
   ```

2. **Set up environment variables:**
   - Copy `server/.env.example` to `server/.env`
   - Update MongoDB connection string and JWT secret

3. **Start development servers:**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on `http://localhost:5000`
   - Frontend React app on `http://localhost:3000`

### Individual Commands

- **Backend only:** `npm run server`
- **Frontend only:** `npm run client`
- **Build for production:** `npm run build`

## 🔧 Environment Setup

### Backend (.env)
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/healthlink
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d
```

### Frontend
The React app will automatically connect to the backend API.

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password reset
- `GET /api/auth/me` - Get current user

### Appointment Endpoints
- `GET /api/appointments` - Get appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

### Triage Endpoints
- `POST /api/triage` - Submit triage form
- `GET /api/triage/:patientId` - Get patient triage history

## 🧠 Triage Logic Examples

- **Fever + Cough** → "Possible Flu - Consider rest and fluids"
- **Chest pain + Shortness of breath** → "Seek emergency care immediately"
- **Headache + Sensitivity to light** → "Possible migraine - Consult doctor"

## 🚀 Deployment

### Backend (Render)
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Frontend (Vercel)
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Deploy automatically on push

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.


