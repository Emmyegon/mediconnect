import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchDoctors } from '../../store/slices/userSlice';
import { createAppointment } from '../../store/slices/appointmentSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { UserIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';

const AppointmentForm: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { doctors, loading: doctorsLoading } = useAppSelector((state) => state.users);
  const { loading: appointmentLoading, error } = useAppSelector((state) => state.appointments);

  const [formData, setFormData] = useState({
    doctor: '',
    appointmentDate: '',
    appointmentTime: '',
    reason: '',
    type: 'consultation' as 'consultation' | 'follow-up' | 'emergency' | 'routine'
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    dispatch(fetchDoctors({ isActive: true }));
  }, [dispatch]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.doctor) {
      newErrors.doctor = 'Please select a doctor';
    }

    if (!formData.appointmentDate) {
      newErrors.appointmentDate = 'Please select a date';
    } else {
      const selectedDate = new Date(formData.appointmentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.appointmentDate = 'Appointment date cannot be in the past';
      }
    }

    if (!formData.appointmentTime) {
      newErrors.appointmentTime = 'Please select a time';
    }

    if (!formData.reason || formData.reason.trim().length < 10) {
      newErrors.reason = 'Please provide a reason (at least 10 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await dispatch(createAppointment({
        doctor: formData.doctor,
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime,
        reason: formData.reason.trim(),
        type: formData.type
      })).unwrap();

      alert('Appointment booked successfully!');
      navigate('/appointments');
    } catch (error) {
      console.error('Failed to book appointment:', error);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Generate time slots (9 AM to 5 PM, 30-minute intervals)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  if (doctorsLoading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Book an Appointment</h1>
        <p className="text-gray-600 mt-2">Schedule a consultation with one of our doctors</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Doctor Selection */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <UserIcon className="w-5 h-5 mr-2" />
              Select Doctor
            </label>
            <select
              value={formData.doctor}
              onChange={(e) => handleChange('doctor', e.target.value)}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.doctor ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Choose a doctor</option>
              {doctors.map((doctor) => (
                <option key={doctor._id} value={doctor._id}>
                  Dr. {doctor.name} {doctor.specialization ? `- ${doctor.specialization}` : ''}
                </option>
              ))}
            </select>
            {errors.doctor && (
              <p className="text-red-600 text-sm mt-1">{errors.doctor}</p>
            )}
          </div>

          {/* Appointment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Appointment Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['consultation', 'follow-up', 'emergency', 'routine'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleChange('type', type)}
                  className={`px-4 py-2 rounded-md border text-sm font-medium capitalize transition-colors ${
                    formData.type === type
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Date Selection */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon className="w-5 h-5 mr-2" />
              Appointment Date
            </label>
            <input
              type="date"
              value={formData.appointmentDate}
              onChange={(e) => handleChange('appointmentDate', e.target.value)}
              min={getMinDate()}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.appointmentDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.appointmentDate && (
              <p className="text-red-600 text-sm mt-1">{errors.appointmentDate}</p>
            )}
          </div>

          {/* Time Selection */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <ClockIcon className="w-5 h-5 mr-2" />
              Appointment Time
            </label>
            <select
              value={formData.appointmentTime}
              onChange={(e) => handleChange('appointmentTime', e.target.value)}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.appointmentTime ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a time</option>
              {timeSlots.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
            {errors.appointmentTime && (
              <p className="text-red-600 text-sm mt-1">{errors.appointmentTime}</p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Visit
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => handleChange('reason', e.target.value)}
              rows={4}
              placeholder="Please describe your symptoms or reason for the appointment..."
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.reason ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.reason ? (
                <p className="text-red-600 text-sm">{errors.reason}</p>
              ) : (
                <p className="text-gray-500 text-sm">
                  {formData.reason.length}/500 characters
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/appointments')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={appointmentLoading}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {appointmentLoading ? 'Booking...' : 'Book Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentForm;