import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { VideoCameraIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchDoctors } from '../../store/slices/userSlice';

const StartCall = ({ userId, onStartCall, joinMode = false }) => {
  const [targetId, setTargetId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { doctors } = useAppSelector((state) => state.users);

  // Fetch available doctors if user is a patient
  useEffect(() => {
    if (!joinMode && user?.role === 'patient') {
      const loadDoctors = async () => {
        try {
          setLoading(true);
          const result = await dispatch(fetchDoctors({ isActive: true }));
          if (fetchDoctors.rejected.match(result)) {
            setError('Unable to load doctors. Please try again later.');
          }
        } catch (err) {
          console.error('Error loading doctors:', err);
          setError('An error occurred while loading doctors.');
        } finally {
          setLoading(false);
        }
      };
      loadDoctors();
    }
  }, [dispatch, joinMode, user?.role]);

  const handleAction = () => {
    if (!targetId.trim()) {
      setError('Please enter a valid ID');
      return;
    }
    
    if (joinMode) {
      navigate(`/call/${targetId}`);
    } else {
      const sessionId = `call_${Date.now()}`;
      onStartCall(targetId, sessionId);
      navigate(`/call/${sessionId}?initiator=true`);
    }
  };

  const handleUserSelect = (id) => {
    setTargetId(id);
    setError(null);
  };

  // Format available doctors for patients
  const availableDoctors = (doctors || []).filter(doc => doc._id !== user?._id);

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">
        {joinMode ? 'Join a Video Call' : 'Start a Video Call'}
      </h2>
      
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="targetId">
          {user?.role === 'doctor' ? 'Enter Patient ID' : 'Enter User ID to Call'}
        </label>
        <input
          type="text"
          id="targetId"
          value={targetId}
          onChange={(e) => {
            setTargetId(e.target.value);
            setError(null);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={user?.role === 'doctor' ? "Enter patient ID" : "Enter user ID"}
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>

      {/* Show available doctors for patients */}
      {!joinMode && user?.role === 'patient' && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Available Doctors:</p>
          {loading ? (
            <p className="text-sm text-gray-500">Loading doctors...</p>
          ) : availableDoctors.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {availableDoctors.map((doctor) => (
                <div
                  key={doctor._id}
                  onClick={() => handleUserSelect(doctor._id)}
                  className={`p-2 rounded-md cursor-pointer hover:bg-gray-100 ${
                    targetId === doctor._id ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <UserCircleIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium">Dr. {doctor.name}</span>
                    {doctor.specialization && (
                      <span className="ml-2 text-xs text-gray-500">
                        ({doctor.specialization})
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 font-mono ml-7">
                    ID: {doctor._id}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No doctors available</p>
          )}
        </div>
      )}

      <button
        onClick={handleAction}
        disabled={!targetId.trim() || loading}
        className={`flex items-center justify-center w-full px-4 py-2 rounded-md text-white ${
          targetId.trim() && !loading
            ? 'bg-blue-600 hover:bg-blue-700'
            : 'bg-gray-400 cursor-not-allowed'
        }`}
      >
        {loading ? (
          'Loading...'
        ) : (
          <>
            <VideoCameraIcon className="h-5 w-5 mr-2" />
            {joinMode ? 'Join Call' : 'Start Video Call'}
          </>
        )}
      </button>
    </div>
  );
};

export default StartCall;