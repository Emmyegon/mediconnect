import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  UserCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  ClockIcon,
  HeartIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

interface Appointment {
  _id: string;
  patient: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
  };
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  reason: string;
  doctorNotes?: string;
  confirmedDiagnosis?: string;
  vitals?: {
    temperature?: number;
    bloodPressure?: { systolic: number; diastolic: number };
    heartRate?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
    weight?: number;
    height?: number;
  };
  latestTriage?: any;
  prescription?: Array<{
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
}

const AppointmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [triageHistory, setTriageHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'consultation' | 'prescription'>('overview');
  
  // Consultation form state
  const [doctorNotes, setDoctorNotes] = useState('');
  const [confirmedDiagnosis, setConfirmedDiagnosis] = useState('');
  const [vitals, setVitals] = useState({
    temperature: '',
    systolic: '',
    diastolic: '',
    heartRate: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    weight: '',
    height: '',
  });
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  // Prescription state
  const [prescriptions, setPrescriptions] = useState<Array<{
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>>([]);

  useEffect(() => {
    fetchAppointmentDetails();
  }, [id]);

  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/doctor/appointments/${id}`);
      const data = response.data.data;
      
      setAppointment(data.appointment);
      setTriageHistory(data.triageHistory || []);
      
      // Pre-fill form with existing data
      if (data.appointment.doctorNotes) setDoctorNotes(data.appointment.doctorNotes);
      if (data.appointment.confirmedDiagnosis) setConfirmedDiagnosis(data.appointment.confirmedDiagnosis);
      if (data.appointment.status) setStatus(data.appointment.status);
      if (data.appointment.prescription) setPrescriptions(data.appointment.prescription);
      
      if (data.appointment.vitals) {
        setVitals({
          temperature: data.appointment.vitals.temperature?.toString() || '',
          systolic: data.appointment.vitals.bloodPressure?.systolic?.toString() || '',
          diastolic: data.appointment.vitals.bloodPressure?.diastolic?.toString() || '',
          heartRate: data.appointment.vitals.heartRate?.toString() || '',
          respiratoryRate: data.appointment.vitals.respiratoryRate?.toString() || '',
          oxygenSaturation: data.appointment.vitals.oxygenSaturation?.toString() || '',
          weight: data.appointment.vitals.weight?.toString() || '',
          height: data.appointment.vitals.height?.toString() || '',
        });
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConsultation = async () => {
    try {
      setSaving(true);
      
      const vitalsData: any = {};
      if (vitals.temperature) vitalsData.temperature = parseFloat(vitals.temperature);
      if (vitals.systolic && vitals.diastolic) {
        vitalsData.bloodPressure = {
          systolic: parseInt(vitals.systolic),
          diastolic: parseInt(vitals.diastolic),
        };
      }
      if (vitals.heartRate) vitalsData.heartRate = parseInt(vitals.heartRate);
      if (vitals.respiratoryRate) vitalsData.respiratoryRate = parseInt(vitals.respiratoryRate);
      if (vitals.oxygenSaturation) vitalsData.oxygenSaturation = parseFloat(vitals.oxygenSaturation);
      if (vitals.weight) vitalsData.weight = parseFloat(vitals.weight);
      if (vitals.height) vitalsData.height = parseFloat(vitals.height);

      await api.patch(`/doctor/appointments/${id}/notes`, {
        doctorNotes,
        confirmedDiagnosis,
        vitals: Object.keys(vitalsData).length > 0 ? vitalsData : undefined,
        status: status || undefined,
      });

      alert('Consultation notes saved successfully!');
      fetchAppointmentDetails();
    } catch (error) {
      console.error('Error saving consultation:', error);
      alert('Failed to save consultation notes');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrescription = async () => {
    try {
      setSaving(true);
      await api.post(`/doctor/appointments/${id}/prescription`, {
        prescription: prescriptions.filter(p => p.medication && p.dosage),
      });
      alert('Prescription saved successfully!');
      fetchAppointmentDetails();
    } catch (error) {
      console.error('Error saving prescription:', error);
      alert('Failed to save prescription');
    } finally {
      setSaving(false);
    }
  };

  const addPrescriptionRow = () => {
    setPrescriptions([...prescriptions, { medication: '', dosage: '', frequency: '', duration: '' }]);
  };

  const updatePrescription = (index: number, field: string, value: string) => {
    const updated = [...prescriptions];
    updated[index] = { ...updated[index], [field]: value };
    setPrescriptions(updated);
  };

  const removePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency': return 'bg-red-100 text-red-800 border-red-200';
      case 'urgent': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'high': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  if (loading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  if (!appointment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Appointment not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/doctor/appointments')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Appointments
        </button>
        <div className="flex items-center space-x-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Update Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Patient Info Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <UserCircleIcon className="w-10 h-10 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{appointment.patient.name}</h1>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                {appointment.patient.email && (
                  <div className="flex items-center">
                    <EnvelopeIcon className="w-4 h-4 mr-1" />
                    {appointment.patient.email}
                  </div>
                )}
                {appointment.patient.phone && (
                  <div className="flex items-center">
                    <PhoneIcon className="w-4 h-4 mr-1" />
                    {appointment.patient.phone}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center text-sm text-gray-600 mb-1">
              <CalendarIcon className="w-4 h-4 mr-1" />
              {new Date(appointment.appointmentDate).toLocaleDateString()}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <ClockIcon className="w-4 h-4 mr-1" />
              {appointment.appointmentTime}
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700">Reason for Visit:</p>
          <p className="text-gray-900 mt-1">{appointment.reason}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'consultation', 'prescription'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Triage Information */}
          {appointment.latestTriage && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Latest Triage Assessment</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  getPriorityColor(appointment.latestTriage.triageResult.priority)
                }`}>
                  {appointment.latestTriage.triageResult.priority.toUpperCase()}
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Symptoms:</p>
                  <ul className="mt-2 space-y-1">
                    {appointment.latestTriage.symptoms.map((symptom: any, idx: number) => (
                      <li key={idx} className="text-sm text-gray-600">
                        • {symptom.name} - <span className="font-medium">{symptom.severity}</span> ({symptom.duration})
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">System Recommendation:</p>
                  <p className="text-sm text-blue-800">{appointment.latestTriage.triageResult.recommendation}</p>
                </div>
              </div>
            </div>
          )}

          {/* Triage History */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Patient Triage History</h2>
            {triageHistory.length > 0 ? (
              <div className="space-y-3">
                {triageHistory.map((triage) => (
                  <div key={triage._id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(triage.createdAt).toLocaleDateString()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        getPriorityColor(triage.triageResult.priority)
                      }`}>
                        {triage.triageResult.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {triage.symptoms.map((s: any) => s.name).join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No triage history available</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'consultation' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vitals Recording */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Record Vitals</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temperature (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={vitals.temperature}
                  onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="37.0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Heart Rate (BPM)
                </label>
                <input
                  type="number"
                  value={vitals.heartRate}
                  onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="72"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  BP Systolic
                </label>
                <input
                  type="number"
                  value={vitals.systolic}
                  onChange={(e) => setVitals({ ...vitals, systolic: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="120"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  BP Diastolic
                </label>
                <input
                  type="number"
                  value={vitals.diastolic}
                  onChange={(e) => setVitals({ ...vitals, diastolic: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="80"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  O2 Saturation (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={vitals.oxygenSaturation}
                  onChange={(e) => setVitals({ ...vitals, oxygenSaturation: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="98"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Respiratory Rate
                </label>
                <input
                  type="number"
                  value={vitals.respiratoryRate}
                  onChange={(e) => setVitals({ ...vitals, respiratoryRate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="16"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={vitals.weight}
                  onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="70"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={vitals.height}
                  onChange={(e) => setVitals({ ...vitals, height: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="170"
                />
              </div>
            </div>
          </div>

          {/* Clinical Notes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Clinical Notes</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Doctor's Notes
                </label>
                <textarea
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  rows={6}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your clinical observations, examination findings, and notes..."
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter confirmed diagnosis..."
                />
              </div>

              <button
                onClick={handleSaveConsultation}
                disabled={saving}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Save Consultation Notes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'prescription' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Prescription</h2>
            <button
              onClick={addPrescriptionRow}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              + Add Medication
            </button>
          </div>

          <div className="space-y-4">
            {prescriptions.map((prescription, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border border-gray-200 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Medication</label>
                  <input
                    type="text"
                    value={prescription.medication}
                    onChange={(e) => updatePrescription(index, 'medication', e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Medicine name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Dosage</label>
                  <input
                    type="text"
                    value={prescription.dosage}
                    onChange={(e) => updatePrescription(index, 'dosage', e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 500mg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Frequency</label>
                  <input
                    type="text"
                    value={prescription.frequency}
                    onChange={(e) => updatePrescription(index, 'frequency', e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Twice daily"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={prescription.duration}
                    onChange={(e) => updatePrescription(index, 'duration', e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 7 days"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => removePrescription(index)}
                    className="w-full px-3 py-2 bg-red-100 text-red-600 rounded text-sm font-medium hover:bg-red-200"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            {prescriptions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No medications added yet. Click "Add Medication" to start.</p>
              </div>
            )}

            {prescriptions.length > 0 && (
              <button
                onClick={handleSavePrescription}
                disabled={saving}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors mt-4"
              >
                {saving ? 'Saving...' : 'Save Prescription'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentDetail;
