import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchTriageHistory } from '../../store/slices/triageSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ClipboardDocumentListIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

const TriageHistory: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { triages, loading, total, page, pages } = useAppSelector((state) => state.triage);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (user) {
      dispatch(fetchTriageHistory({ patientId: user._id, page: currentPage, limit: 10 }));
    }
  }, [dispatch, user, currentPage]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'urgent':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'high':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Triage History</h1>
        <p className="text-gray-600 mt-1">View your past symptom assessments and recommendations</p>
      </div>

      {triages.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <ClipboardDocumentListIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Triage Assessments Yet</h3>
          <p className="text-gray-600 mb-4">You haven't completed any triage assessments.</p>
          <a
            href="/triage"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Start Triage Assessment
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {triages.map((triage) => (
            <div key={triage._id} className="bg-white shadow rounded-lg overflow-hidden">
              {/* Header */}
              <div
                className="px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleExpand(triage._id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {triage.symptoms.map(s => s.name).join(', ')}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        getPriorityColor(triage.triageResult.priority)
                      }`}>
                        {triage.triageResult.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(triage.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Triage Score: {triage.triageScore}/100</span>
                    {expandedId === triage._id ? (
                      <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === triage._id && (
                <div className="px-6 py-4 space-y-4">
                  {/* Symptoms */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Reported Symptoms:</h4>
                    <div className="space-y-2">
                      {triage.symptoms.map((symptom, idx) => (
                        <div key={idx} className="flex items-center space-x-2 text-sm">
                          <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
                          <span className="font-medium">{symptom.name}</span>
                          <span className="text-gray-500">-</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            symptom.severity === 'severe' ? 'bg-red-100 text-red-800' :
                            symptom.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {symptom.severity}
                          </span>
                          <span className="text-gray-500">({symptom.duration})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pain Level */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Pain Level:</h4>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            triage.painLevel >= 7 ? 'bg-red-600' :
                            triage.painLevel >= 4 ? 'bg-yellow-600' :
                            'bg-green-600'
                          }`}
                          style={{ width: `${(triage.painLevel / 10) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{triage.painLevel}/10</span>
                    </div>
                  </div>

                  {/* Vital Signs */}
                  {triage.vitalSigns && Object.keys(triage.vitalSigns).length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Vital Signs:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {triage.vitalSigns.temperature && (
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-xs text-gray-600">Temperature</p>
                            <p className="text-lg font-semibold text-gray-900">{triage.vitalSigns.temperature}°C</p>
                          </div>
                        )}
                        {triage.vitalSigns.bloodPressure && (
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-xs text-gray-600">Blood Pressure</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {triage.vitalSigns.bloodPressure.systolic}/{triage.vitalSigns.bloodPressure.diastolic}
                            </p>
                          </div>
                        )}
                        {triage.vitalSigns.heartRate && (
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-xs text-gray-600">Heart Rate</p>
                            <p className="text-lg font-semibold text-gray-900">{triage.vitalSigns.heartRate} BPM</p>
                          </div>
                        )}
                        {triage.vitalSigns.respiratoryRate && (
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-xs text-gray-600">Respiratory Rate</p>
                            <p className="text-lg font-semibold text-gray-900">{triage.vitalSigns.respiratoryRate}/min</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Risk Factors */}
                  {triage.riskFactors && triage.riskFactors.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Risk Factors:</h4>
                      <div className="flex flex-wrap gap-2">
                        {triage.riskFactors.map((factor, idx) => (
                          <span key={idx} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs">
                            {factor}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* System Recommendation */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">System Recommendation:</h4>
                    <p className="text-sm text-blue-800 mb-3">{triage.triageResult.recommendation}</p>
                    <div className="flex items-center space-x-4 text-xs">
                      <div>
                        <span className="font-medium text-blue-900">Suggested Action: </span>
                        <span className="text-blue-800">{triage.triageResult.suggestedAction.replace(/-/g, ' ').toUpperCase()}</span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-900">Timeframe: </span>
                        <span className="text-blue-800">{triage.triageResult.timeToSeekCare.replace(/-/g, ' ')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Doctor Review (if available) */}
                  {triage.doctorReview && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-green-900 mb-2">✓ Doctor Review:</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-green-900">Doctor's Notes: </span>
                          <span className="text-green-800">{triage.doctorReview.notes}</span>
                        </div>
                        <div>
                          <span className="font-medium text-green-900">Confirmed Diagnosis: </span>
                          <span className="text-green-800">{triage.doctorReview.confirmedDiagnosis}</span>
                        </div>
                        <div>
                          <span className="font-medium text-green-900">Confirmed Priority: </span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            getPriorityColor(triage.doctorReview.confirmedPriority)
                          }`}>
                            {triage.doctorReview.confirmedPriority.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs text-green-700">
                          Reviewed on {new Date(triage.doctorReview.reviewedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Medical History */}
                  {triage.medicalHistory && triage.medicalHistory.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Medical History:</h4>
                      <div className="space-y-1">
                        {triage.medicalHistory.map((item, idx) => (
                          <div key={idx} className="text-sm text-gray-700">
                            • {item.condition} <span className="text-gray-500">({item.status})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Medications */}
                  {triage.medications && triage.medications.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Current Medications:</h4>
                      <div className="space-y-1">
                        {triage.medications.map((med, idx) => (
                          <div key={idx} className="text-sm text-gray-700">
                            • {med.name} {med.dosage && `- ${med.dosage}`} {med.frequency && `(${med.frequency})`}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Allergies */}
                  {triage.allergies && triage.allergies.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Allergies:</h4>
                      <div className="flex flex-wrap gap-2">
                        {triage.allergies.map((allergy, idx) => (
                          <span key={idx} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs">
                            {allergy}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {pages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(pages, prev + 1))}
                disabled={currentPage === pages}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}

          {/* Summary */}
          <div className="text-center text-sm text-gray-600 mt-4">
            Showing {triages.length} of {total} assessments
          </div>
        </div>
      )}
    </div>
  );
};

export default TriageHistory;









