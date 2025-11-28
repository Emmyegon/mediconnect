import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { submitTriage } from '../../store/slices/triageSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';

interface Symptom {
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  duration: string;
}

const TriageForm: React.FC = () => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.triage);

  const [formData, setFormData] = useState({
    symptoms: [] as Symptom[],
    painLevel: 0,
    vitalSigns: {
      temperature: '',
      bloodPressure: { systolic: '', diastolic: '' },
      heartRate: '',
      respiratoryRate: ''
    },
    riskFactors: [] as string[],
    medicalHistory: [] as Array<{ condition: string; status: 'active' | 'resolved' | 'chronic' }>,
    medications: [] as Array<{ name: string; dosage: string; frequency: string }>,
    allergies: [] as string[]
  });

  const [currentSymptom, setCurrentSymptom] = useState({
    name: '',
    severity: 'moderate' as 'mild' | 'moderate' | 'severe',
    duration: ''
  });

  const [newRiskFactor, setNewRiskFactor] = useState('');

  const commonSymptoms = [
    'Fever', 'Cough', 'Headache', 'Chest pain', 'Shortness of breath',
    'Nausea', 'Vomiting', 'Diarrhea', 'Abdominal pain', 'Fatigue',
    'Dizziness', 'Sensitivity to light', 'Muscle aches', 'Sore throat'
  ];

  const riskFactors = [
    'Diabetes', 'High blood pressure', 'Heart disease', 'Asthma',
    'Smoking', 'Obesity', 'Age over 65', 'Immunocompromised'
  ];

  const handleAddSymptom = () => {
    if (currentSymptom.name && currentSymptom.duration) {
      setFormData(prev => ({
        ...prev,
        symptoms: [...prev.symptoms, currentSymptom]
      }));
      setCurrentSymptom({ name: '', severity: 'moderate', duration: '' });
    }
  };

  const handleRemoveSymptom = (index: number) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.filter((_, i) => i !== index)
    }));
  };

  const handleAddRiskFactor = () => {
    if (newRiskFactor && !formData.riskFactors.includes(newRiskFactor)) {
      setFormData(prev => ({
        ...prev,
        riskFactors: [...prev.riskFactors, newRiskFactor]
      }));
      setNewRiskFactor('');
    }
  };




  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build vital signs object, only including fields that have values
    const vitalSigns: any = {};
    
    if (formData.vitalSigns.temperature) {
      vitalSigns.temperature = parseFloat(formData.vitalSigns.temperature);
    }
    
    if (formData.vitalSigns.bloodPressure.systolic && formData.vitalSigns.bloodPressure.diastolic) {
      vitalSigns.bloodPressure = {
        systolic: parseInt(formData.vitalSigns.bloodPressure.systolic),
        diastolic: parseInt(formData.vitalSigns.bloodPressure.diastolic)
      };
    }
    
    if (formData.vitalSigns.heartRate) {
      vitalSigns.heartRate = parseInt(formData.vitalSigns.heartRate);
    }
    
    if (formData.vitalSigns.respiratoryRate) {
      vitalSigns.respiratoryRate = parseInt(formData.vitalSigns.respiratoryRate);
    }
    
    const triageData: any = {
      symptoms: formData.symptoms,
      painLevel: formData.painLevel,
      riskFactors: formData.riskFactors,
      medicalHistory: formData.medicalHistory,
      medications: formData.medications,
      allergies: formData.allergies
    };
    
    // Only include vitalSigns if at least one field has a value
    if (Object.keys(vitalSigns).length > 0) {
      triageData.vitalSigns = vitalSigns;
    }

    try {
      await dispatch(submitTriage(triageData)).unwrap();
      alert('Triage assessment submitted successfully!');
    } catch (error) {
      console.error('Triage submission failed:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Symptom Triage Assessment</h1>
          <p className="text-gray-600 mt-1">
            Please provide detailed information about your symptoms to receive appropriate medical guidance.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Symptoms Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Symptoms</h2>
            
            {/* Add Symptom */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Symptom</label>
                <select
                  value={currentSymptom.name}
                  onChange={(e) => setCurrentSymptom(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select a symptom</option>
                  {commonSymptoms.map(symptom => (
                    <option key={symptom} value={symptom}>{symptom}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                <select
                  value={currentSymptom.severity}
                  onChange={(e) => setCurrentSymptom(prev => ({ ...prev, severity: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <input
                  type="text"
                  value={currentSymptom.duration}
                  onChange={(e) => setCurrentSymptom(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="e.g., 2 days, 1 week"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAddSymptom}
                  className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  Add Symptom
                </button>
              </div>
            </div>

            {/* Current Symptoms List */}
            {formData.symptoms.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Added Symptoms:</h3>
                {formData.symptoms.map((symptom, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                    <span className="text-sm">
                      <strong>{symptom.name}</strong> - {symptom.severity} severity, {symptom.duration}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSymptom(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pain Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pain Level (0-10): {formData.painLevel}
            </label>
            <input
              type="range"
              min="0"
              max="10"
              value={formData.painLevel}
              onChange={(e) => setFormData(prev => ({ ...prev, painLevel: parseInt(e.target.value) }))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>No pain</span>
              <span>Moderate pain</span>
              <span>Severe pain</span>
            </div>
          </div>

          {/* Vital Signs */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Vital Signs (Optional)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.vitalSigns.temperature}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    vitalSigns: { ...prev.vitalSigns, temperature: e.target.value }
                  }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Heart Rate (BPM)</label>
                <input
                  type="number"
                  value={formData.vitalSigns.heartRate}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    vitalSigns: { ...prev.vitalSigns, heartRate: e.target.value }
                  }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure (Systolic)</label>
                <input
                  type="number"
                  value={formData.vitalSigns.bloodPressure.systolic}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    vitalSigns: {
                      ...prev.vitalSigns,
                      bloodPressure: { ...prev.vitalSigns.bloodPressure, systolic: e.target.value }
                    }
                  }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure (Diastolic)</label>
                <input
                  type="number"
                  value={formData.vitalSigns.bloodPressure.diastolic}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    vitalSigns: {
                      ...prev.vitalSigns,
                      bloodPressure: { ...prev.vitalSigns.bloodPressure, diastolic: e.target.value }
                    }
                  }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Risk Factors */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Risk Factors</h2>
            <div className="flex gap-2 mb-4">
              <select
                value={newRiskFactor}
                onChange={(e) => setNewRiskFactor(e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select a risk factor</option>
                {riskFactors.map(factor => (
                  <option key={factor} value={factor}>{factor}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddRiskFactor}
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
              >
                Add
              </button>
            </div>
            
            {formData.riskFactors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.riskFactors.map((factor, index) => (
                  <span key={index} className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm">
                    {factor}
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        riskFactors: prev.riskFactors.filter((_, i) => i !== index)
                      }))}
                      className="ml-2 text-primary-600 hover:text-primary-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={formData.symptoms.length === 0}
              className="bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Triage Assessment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TriageForm;



