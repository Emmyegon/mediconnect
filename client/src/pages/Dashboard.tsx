import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchAppointments } from '../store/slices/appointmentSlice';
import { fetchTriageHistory } from '../store/slices/triageSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  CalendarIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { appointments, loading: appointmentsLoading } = useAppSelector((state) => state.appointments);
  const { triages, loading: triagesLoading } = useAppSelector((state) => state.triage);

  useEffect(() => {
    if (user) {
      dispatch(fetchAppointments({ page: 1, limit: 5 }));
      dispatch(fetchTriageHistory({ patientId: user._id, page: 1, limit: 5 }));
    }
  }, [dispatch, user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getRoleBasedContent = () => {
    if (!user) return null;

    switch (user.role) {
      case 'patient':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              to="/triage"
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <ClipboardDocumentListIcon className="w-8 h-8 text-primary-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Symptom Triage</h3>
                  <p className="text-gray-600">Get immediate health guidance</p>
                </div>
              </div>
            </Link>

            <Link
              to="/appointments"
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <CalendarIcon className="w-8 h-8 text-primary-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Book Appointment</h3>
                  <p className="text-gray-600">Schedule with a doctor</p>
                </div>
              </div>
            </Link>

            <Link
              to="/triage/history"
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <ChartBarIcon className="w-8 h-8 text-primary-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Health History</h3>
                  <p className="text-gray-600">View your assessments</p>
                </div>
              </div>
            </Link>
          </div>
        );

      case 'doctor':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              to="/doctor/dashboard"
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <UserGroupIcon className="w-8 h-8 text-primary-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Doctor Dashboard</h3>
                  <p className="text-gray-600">Manage your practice</p>
                </div>
              </div>
            </Link>

            <Link
              to="/appointments"
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <CalendarIcon className="w-8 h-8 text-primary-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Appointments</h3>
                  <p className="text-gray-600">View your schedule</p>
                </div>
              </div>
            </Link>

            <Link
              to="/triage/urgent"
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Urgent Cases</h3>
                  <p className="text-gray-600">Review urgent triage</p>
                </div>
              </div>
            </Link>
          </div>
        );

      case 'admin':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              to="/admin/dashboard"
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <ChartBarIcon className="w-8 h-8 text-primary-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Admin Dashboard</h3>
                  <p className="text-gray-600">System management</p>
                </div>
              </div>
            </Link>

            <Link
              to="/users"
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <UserGroupIcon className="w-8 h-8 text-primary-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
                  <p className="text-gray-600">Manage users and roles</p>
                </div>
              </div>
            </Link>

            <Link
              to="/appointments"
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <CalendarIcon className="w-8 h-8 text-primary-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">All Appointments</h3>
                  <p className="text-gray-600">Monitor system activity</p>
                </div>
              </div>
            </Link>
          </div>
        );

      default:
        return null;
    }
  };

  if (appointmentsLoading || triagesLoading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {getGreeting()}, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-2">
          Welcome to your HealthLink dashboard. Here's what you can do today.
        </p>
      </div>

      {/* Role-based Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        {getRoleBasedContent()}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Appointments */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Appointments</h3>
              <Link
                to="/appointments"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="p-6">
            {appointments.length > 0 ? (
              <div className="space-y-4">
                {appointments.slice(0, 3).map((appointment) => (
                  <div key={appointment._id} className="flex items-center space-x-3">
                    <CalendarIcon className="w-5 h-5 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {appointment.reason}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.appointmentTime}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      appointment.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                      appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      appointment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {appointment.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No appointments yet</p>
                <Link
                  to="/appointments/new"
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Book your first appointment
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Triage Assessments */}
        {user?.role === 'patient' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Triage</h3>
                <Link
                  to="/triage/history"
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  View all
                </Link>
              </div>
            </div>
            <div className="p-6">
              {triages.length > 0 ? (
                <div className="space-y-4">
                  {triages.slice(0, 3).map((triage) => (
                    <div key={triage._id} className="flex items-center space-x-3">
                      <ClipboardDocumentListIcon className="w-5 h-5 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {triage.symptoms.map(s => s.name).join(', ')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(triage.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        triage.triageResult.priority === 'emergency' ? 'bg-red-100 text-red-800' :
                        triage.triageResult.priority === 'urgent' ? 'bg-orange-100 text-orange-800' :
                        triage.triageResult.priority === 'high' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {triage.triageResult.priority}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <ClipboardDocumentListIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No triage assessments yet</p>
                  <Link
                    to="/triage"
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Start your first assessment
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;



