import React from 'react';
import { useNavigate } from 'react-router-dom';
import { VideoCameraIcon } from '@heroicons/react/24/outline';

const VideoConsultationPage = () => {
  const navigate = useNavigate();

  const handleStartConsultation = () => {
    navigate('/call/start');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Video Consultation</h1>
        <p className="text-gray-600">Start a new video consultation or join an existing one</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Start New Consultation */}
          <div className="border rounded-lg p-6 text-center hover:shadow-md transition-shadow">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <VideoCameraIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start New Consultation</h3>
            <p className="text-gray-600 mb-4">Start a new video consultation with a healthcare provider</p>
            <button
              onClick={handleStartConsultation}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Start Consultation
            </button>
          </div>

          {/* Join Consultation */}
          <div className="border rounded-lg p-6 text-center hover:shadow-md transition-shadow">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <VideoCameraIcon className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Join Consultation</h3>
            <p className="text-gray-600 mb-4">Join an existing consultation using a session ID</p>
            <button
              onClick={() => navigate('/call/join')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Join Consultation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoConsultationPage;