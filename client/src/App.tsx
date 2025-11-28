import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { useAppSelector } from './hooks/redux';
import React from 'react';
import { useNavigate } from 'react-router-dom';

// Layout Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import TriageForm from './pages/triage/TriageForm';
import TriageHistory from './pages/triage/TriageHistory';
import Appointments from './pages/appointments/Appointments';
import AppointmentForm from './pages/appointments/AppointmentForm';
import VideoConsultationPage from './pages/Video-Consultation/VideoConsultationPage';

// Video Call Components
import VideoCall from './components/VideoCall/VideoCall';
import CallHistory from './components/CallHistory/CallHistory';
import StartCall from './components/VideoCall/StartCall';

// Doctor Pages
import DoctorLayout from './components/doctor/DoctorLayout';
import DoctorDashboardOverview from './pages/doctor/DoctorDashboardOverview';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import AppointmentDetail from './pages/doctor/AppointmentDetail';
import DoctorAnalytics from './pages/doctor/DoctorAnalytics';
import DoctorSettings from './pages/doctor/DoctorSettings';
import AdminDashboard from './pages/admin/AdminDashboard';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ 
  children, 
  allowedRoles 
}) => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Public Route Component
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Video Call Wrapper Component
const VideoCallWrapper = () => {
  const userId = useAppSelector(state => state.auth.user?._id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get targetUserId from URL parameters or set to null
  const targetUserId = searchParams.get('targetUserId') || undefined;

  return (
    <VideoCall 
      userId={userId || ''}
      targetUserId={targetUserId}
      onEndCall={() => {
        console.log('Call ended, navigating to dashboard');
        navigate('/dashboard');
      }}
    />
  );
};

// Video Call Routes Component
const VideoCallRoutes = () => {
  const userId = useAppSelector(state => state.auth.user?._id);
  const navigate = useNavigate();

  return (
    <Routes>
      <Route 
        path="start" 
        element={
          <ProtectedRoute>
            <StartCall 
              userId={userId || ''}
              onStartCall={(calleeId: string, sessionId: string) => {
                console.log(`Starting call with ${calleeId}, session: ${sessionId}`);
                // Pass targetUserId as query parameter
                navigate(`/call/${sessionId}?targetUserId=${calleeId}`);
              }}
            />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path=":sessionId" 
        element={
          <ProtectedRoute>
            <VideoCallWrapper />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

              {/* Video Call Routes */}
              <Route path="/call/*" element={<VideoCallRoutes />} />

              {/* Call History */}
              <Route path="/call-history" element={<ProtectedRoute><CallHistory /></ProtectedRoute>} />

              {/* Triage Routes */}
              <Route path="/triage" element={<ProtectedRoute><TriageForm /></ProtectedRoute>} />
              <Route path="/triage/history" element={<ProtectedRoute><TriageHistory /></ProtectedRoute>} />

              {/* Appointments Routes */}
              <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
              <Route path="/appointments/new" element={<ProtectedRoute><AppointmentForm /></ProtectedRoute>} />

              {/* Video Consultation */}
              <Route 
                path="/video-consultation" 
                element={
                  <ProtectedRoute>
                    <VideoConsultationPage />
                  </ProtectedRoute>
                } 
              />

              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

              {/* Doctor Routes */}
              <Route 
                path="/doctor" 
                element={
                  <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                    <DoctorLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<DoctorDashboardOverview />} />
                <Route path="appointments" element={<DoctorAppointments />} />
                <Route path="appointments/:id" element={<AppointmentDetail />} />
                <Route path="analytics" element={<DoctorAnalytics />} />
                <Route path="settings" element={<DoctorSettings />} />
              </Route>

              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />

              {/* Default Route */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </Provider>
  );
}

export default App;