// src/components/CallHistory/CallHistory.jsx
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { format, parseISO } from 'date-fns';
import { 
  PhoneIcon, 
  VideoCameraIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import callService from '../../services/callService';

const CallHistory = () => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useSelector((state) => state.auth);

  const fetchCallHistory = async () => {
    if (!user?._id) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await callService.getCallHistory(user._id);
      setCalls(data);
    } catch (err) {
      console.error('Error fetching call history:', err);
      setError('Failed to load call history. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCallHistory();
  }, [user?._id]);

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'missed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'declined':
        return <XCircleIcon className="h-5 w-5 text-amber-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  if (loading && calls.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Call History</h1>
        <button
          onClick={fetchCallHistory}
          disabled={loading}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
          title="Refresh"
        >
          <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {calls.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {loading ? 'Loading...' : 'No call history available'}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {calls.map((call) => (
              <li key={call._id || call.id} className="hover:bg-gray-50 transition-colors">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {call.type === 'video' ? (
                          <VideoCameraIcon className="h-6 w-6 text-blue-600" />
                        ) : (
                          <PhoneIcon className="h-6 w-6 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {call.participants?.join(' → ') || 'Call'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {call.date ? format(parseISO(call.date), 'MMM d, yyyy h:mm a') : '--'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">
                        {formatDuration(call.duration)}
                      </span>
                      {getStatusIcon(call.status)}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CallHistory;