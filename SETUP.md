# HealthLink Setup Guide

This guide will help you set up and run the HealthLink e-Clinic & Triage System on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download here](https://www.mongodb.com/try/download/community)
- **Git** - [Download here](https://git-scm.com/)

## Quick Start

### 1. Clone and Install Dependencies

```bash
# Install all dependencies (both server and client)
npm run install-all
```

### 2. Set Up Environment Variables

#### Backend Environment (.env)
Create a `.env` file in the `server` directory:

```bash
# Copy the example file
cp server/env.example server/.env
```

Edit `server/.env` with your configuration:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/healthlink
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_secure
JWT_EXPIRE=7d

# Email configuration (for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Frontend URL
CLIENT_URL=http://localhost:3000
```

#### Frontend Environment
Create a `.env` file in the `client/healthlink-client` directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# On Windows
net start MongoDB

# On macOS/Linux
sudo systemctl start mongod
# or
brew services start mongodb/brew/mongodb-community
```

### 4. Run the Application

```bash
# Start both server and client concurrently
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend React app on `http://localhost:3000`

## Individual Commands

### Backend Only
```bash
npm run server
```

### Frontend Only
```bash
npm run client
```

### Install Dependencies Separately
```bash
# Backend only
npm run install-server

# Frontend only
npm run install-client
```

## Project Structure

```
healthlink/
├── client/healthlink-client/     # React frontend
│   ├── src/
│   │   ├── components/           # Reusable components
│   │   ├── pages/               # Page components
│   │   ├── store/               # Redux store and slices
│   │   ├── utils/               # Utility functions
│   │   └── hooks/               # Custom hooks
├── server/                      # Express backend
│   ├── models/                  # MongoDB schemas
│   ├── controllers/             # Route controllers
│   ├── routes/                  # API routes
│   ├── middleware/              # Custom middleware
│   └── config/                  # Configuration files
└── package.json                 # Root package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/logout` - Logout

### Appointments
- `GET /api/appointments` - Get appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments/:id` - Get single appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment
- `GET /api/appointments/available/:doctorId` - Get available slots
- `GET /api/appointments/stats` - Get appointment statistics

### Triage
- `POST /api/triage` - Submit triage form
- `GET /api/triage/patient/:patientId` - Get patient triage history
- `GET /api/triage/:id` - Get single triage assessment
- `PUT /api/triage/:id` - Update triage assessment
- `GET /api/triage/urgent` - Get urgent triage cases
- `GET /api/triage/stats` - Get triage statistics

### Users
- `GET /api/users` - Get all users (Admin)
- `GET /api/users/:id` - Get single user
- `PUT /api/users/:id` - Update user
- `GET /api/users/doctors` - Get doctors
- `PUT /api/users/:id/deactivate` - Deactivate user
- `PUT /api/users/:id/activate` - Activate user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/stats` - Get user statistics

## User Roles

### Patient
- Submit symptom triage assessments
- Book appointments with doctors
- View appointment history
- Manage profile

### Doctor
- View patient triage assessments
- Manage appointments
- Access doctor dashboard
- Update patient records

### Admin
- Manage all users
- View system statistics
- Monitor appointments
- Access admin dashboard

## Triage Logic Examples

The system includes intelligent triage logic:

- **Fever + Cough** → "Possible Flu - Consider rest and fluids"
- **Chest pain + Shortness of breath** → "Seek emergency care immediately"
- **Headache + Sensitivity to light** → "Possible migraine - Consult doctor"

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check the connection string in `.env`
   - Verify MongoDB is accessible on the default port (27017)

2. **Port Already in Use**
   - Change the PORT in `server/.env`
   - Kill processes using the ports: `lsof -ti:5000 | xargs kill -9`

3. **Dependencies Installation Failed**
   - Clear npm cache: `npm cache clean --force`
   - Delete `node_modules` and `package-lock.json`
   - Run `npm install` again

4. **Frontend Build Issues**
   - Ensure all dependencies are installed
   - Check for TypeScript errors
   - Verify TailwindCSS configuration

### Development Tips

1. **Hot Reload**: Both frontend and backend support hot reload during development
2. **API Testing**: Use Postman or similar tools to test API endpoints
3. **Database**: Use MongoDB Compass for database management
4. **Logs**: Check console output for detailed error messages

## Production Deployment

### Backend (Render)
1. Connect your GitHub repository
2. Set environment variables in Render dashboard
3. Deploy automatically on push to main branch

### Frontend (Vercel)
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set output directory: `build`
4. Deploy automatically on push

### Environment Variables for Production

#### Backend
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/healthlink
JWT_SECRET=your_production_jwt_secret
JWT_EXPIRE=7d
CLIENT_URL=https://your-frontend-domain.com
```

#### Frontend
```env
REACT_APP_API_URL=https://your-backend-domain.com/api
```

## Support

If you encounter any issues:

1. Check the console output for error messages
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed
4. Check MongoDB connection
5. Review the API documentation above

## Next Steps

After successful setup:

1. Create your first admin user
2. Add some doctors to the system
3. Test the triage functionality
4. Book test appointments
5. Explore the different user dashboards

Happy coding! 🏥✨









