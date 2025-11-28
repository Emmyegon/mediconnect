import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchAppointmentsWithTriage } from '../../store/slices/appointmentSlice';
import { addDoctorNotes } from '../../store/slices/triageSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';

interface DoctorNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  triageId: string;
  patientName: string;
  currentRecommendation: string;
  currentPriority: string;
}

const DoctorNotesModal: React.FC<DoctorNotesModalProps> = ({
  isOpen,
  onClose,
  triageId,
  patientName,
  currentRecommendation,
  currentPriority
}) => {
  const dispatch = useAppDispatch();
  const [doctorNotes, setDoctorNotes] = useState('');
  const [confirmedDiagnosis, setConfirmedDiagnosis] = useState(currentRecommendation);
  const [confirmedPriority, setConfirmedPriority] = useState(currentPriority);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await dispatch(addDoctorNotes({
        id: triageId,
        doctorNotes,
        confirmedDiagnosis,
        confirmedPriority
      })).unwrap();
      alert('Doctor notes added successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to add doctor notes:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Add Doctor Notes - {patientName}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Doctor's Notes
            </label>
            <textarea
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              required
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter your clinical notes and observations..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmed Diagnosis
            </label>
            <textarea
              value={confirmedDiagnosis}
              onChange={(e) => setConfirmedDiagnosis(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Confirm or update the diagnosis..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmed Priority
            </label>
            <select
              value={confirmedPriority}
              onChange={(e) => setConfirmedPriority(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DoctorDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { appointments, loading } = useAppSelector((state) => state.appointments);
  const [selectedTriage, setSelectedTriage] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('scheduled');

  useEffect(() => {
    dispatch(fetchAppointmentsWithTriage({ status: statusFilter }));
  }, [dispatch, statusFilter]);

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

  const openNotesModal = (triage: any, patientName: string) => {
    setSelectedTriage({ ...triage, patientName });
    setModalOpen(true);
  };

  if (loading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
        <p className="text-gray-600 mt-1">View patient appointments with triage assessments</p>
      </div>

      {/* Filter */}
      <div className="mb-6 bg-white shadow rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Status
        </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Appointments</option>
          <option value="scheduled">Scheduled</option>
          <option value="confirmed">Confirmed</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {appointments.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-gray-600">No appointments found</p>
          </div>
        ) : (
          appointments.map((appointment: any) => (
            <div key={appointment._id} className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {appointment.patient.name}
                  </h3>
                  <p className="text-sm text-gray-600">{appointment.patient.email}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.appointmentTime}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                  appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  appointment.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                  appointment.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {appointment.status}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700">Reason for Visit:</p>
                <p className="text-sm text-gray-600">{appointment.reason}</p>
              </div>

              {/* Triage Information */}
              {appointment.latestTriage ? (
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-md font-semibold text-gray-900">Latest Triage Assessment</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      getPriorityColor(appointment.latestTriage.triageResult.priority)
                    }`}>
                      {appointment.latestTriage.triageResult.priority.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Symptoms:</p>
                      <ul className="text-sm text-gray-600 list-disc list-inside">
                        {appointment.latestTriage.symptoms.map((symptom: any, idx: number) => (
                          <li key={idx}>
                            {symptom.name} - <span className="font-medium">{symptom.severity}</span> ({symptom.duration})
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Vital Signs:</p>
                      {appointment.latestTriage.vitalSigns ? (
                        <div className="text-sm text-gray-600 space-y-1">
                          {appointment.latestTriage.vitalSigns.temperature && (
                            <p>Temperature: {appointment.latestTriage.vitalSigns.temperature}°C</p>
                          )}
                          {appointment.latestTriage.vitalSigns.bloodPressure && (
                            <p>BP: {appointment.latestTriage.vitalSigns.bloodPressure.systolic}/{appointment.latestTriage.vitalSigns.bloodPressure.diastolic}</p>
                          )}
                          {appointment.latestTriage.vitalSigns.heartRate && (
                            <p>Heart Rate: {appointment.latestTriage.vitalSigns.heartRate} BPM</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No vital signs recorded</p>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-1">System Recommendation:</p>
                    <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                      {appointment.latestTriage.triageResult.recommendation}
                    </p>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-1">Suggested Action:</p>
                    <p className="text-sm text-gray-600">
                      {appointment.latestTriage.triageResult.suggestedAction.replace(/-/g, ' ').toUpperCase()} - 
                      {appointment.latestTriage.triageResult.timeToSeekCare.replace(/-/g, ' ')}
                    </p>
                  </div>

                  {appointment.latestTriage.riskFactors && appointment.latestTriage.riskFactors.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">Risk Factors:</p>
                      <div className="flex flex-wrap gap-2">
                        {appointment.latestTriage.riskFactors.map((factor: string, idx: number) => (
                          <span key={idx} className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                            {factor}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Doctor Review Section */}
                  {appointment.latestTriage.doctorReview ? (
                    <div className="bg-green-50 p-4 rounded mt-4">
                      <p className="text-sm font-medium text-green-900 mb-2">✓ Doctor Review Completed</p>
                      <p className="text-sm text-gray-700 mb-1"><strong>Notes:</strong> {appointment.latestTriage.doctorReview.notes}</p>
                      <p className="text-sm text-gray-700 mb-1"><strong>Confirmed Diagnosis:</strong> {appointment.latestTriage.doctorReview.confirmedDiagnosis}</p>
                      <p className="text-sm text-gray-700"><strong>Confirmed Priority:</strong> {appointment.latestTriage.doctorReview.confirmedPriority}</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => openNotesModal(
                        appointment.latestTriage,
                        appointment.patient.name
                      )}
                      className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 text-sm"
                    >
                      Add Doctor Notes & Confirm Assessment
                    </button>
                  )}
                </div>
              ) : (
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm text-gray-500 italic">No triage assessment available for this patient</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Doctor Notes Modal */}
      {selectedTriage && (
        <DoctorNotesModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedTriage(null);
            // Refresh appointments
            dispatch(fetchAppointmentsWithTriage({ status: statusFilter }));
          }}
          triageId={selectedTriage._id}
          patientName={selectedTriage.patientName}
          currentRecommendation={selectedTriage.triageResult.recommendation}
          currentPriority={selectedTriage.triageResult.priority}
        />
      )}
    </div>
  );
};

export default DoctorDashboard;









