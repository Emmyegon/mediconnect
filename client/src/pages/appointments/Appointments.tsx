import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchAppointments, cancelAppointment } from '../../store/slices/appointmentSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { CalendarIcon, ClockIcon, UserIcon, PlusIcon } from '@heroicons/react/24/outline';

const Appointments: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { appointments, loading, error } = useAppSelector((state) => state.appointments);

  useEffect(() => {
    dispatch(fetchAppointments({ page: 1, limit: 20 }));
  }, [dispatch]);

  const handleCancelAppointment = async (id: string) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await dispatch(cancelAppointment(id)).unwrap();
        alert('Appointment cancelled successfully');
      } catch (error) {
        console.error('Failed to cancel appointment:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no-show':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
        {user?.role === 'patient' && (
          <Link
            to="/appointments/new"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Book Appointment
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {appointments.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments yet</h3>
          <p className="text-gray-600 mb-6">Book your first appointment to get started</p>
          {user?.role === 'patient' && (
            <Link
              to="/appointments/new"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Book Appointment
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div key={appointment._id} className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                    {appointment.type && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {appointment.type}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="flex items-start space-x-3">
                      <CalendarIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Date</p>
                        <p className="text-sm text-gray-600">
                          {new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <ClockIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Time</p>
                        <p className="text-sm text-gray-600">{appointment.appointmentTime}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <UserIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user?.role === 'patient' ? 'Doctor' : 'Patient'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {user?.role === 'patient' 
                            ? `Dr. ${appointment.doctor?.name || 'N/A'}` 
                            : appointment.patient?.name || 'N/A'}
                        </p>
                        {user?.role === 'patient' && appointment.doctor?.specialization && (
                          <p className="text-xs text-gray-500">{appointment.doctor.specialization}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-900 mb-1">Reason</p>
                    <p className="text-sm text-gray-600">{appointment.reason}</p>
                  </div>

                  {appointment.notes && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-900 mb-1">Notes</p>
                      <p className="text-sm text-gray-600">{appointment.notes}</p>
                    </div>
                  )}
                </div>

                <div className="ml-4">
                  {user?.role === 'patient' && appointment.status === 'scheduled' && (
                    <button
                      onClick={() => handleCancelAppointment(appointment._id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Appointments;









