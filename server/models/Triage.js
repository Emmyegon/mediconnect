const mongoose = require('mongoose');

const triageSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient is required']
  },
  symptoms: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe'],
      default: 'moderate'
    },
    duration: {
      type: String,
      required: true,
      trim: true
    }
  }],
  additionalSymptoms: [{
    type: String,
    trim: true
  }],
  painLevel: {
    type: Number,
    min: 0,
    max: 10,
    required: [true, 'Pain level is required']
  },
  vitalSigns: {
    temperature: {
      type: Number,
      min: 30,
      max: 45
    },
    bloodPressure: {
      systolic: {
        type: Number,
        min: 50,
        max: 250
      },
      diastolic: {
        type: Number,
        min: 30,
        max: 150
      }
    },
    heartRate: {
      type: Number,
      min: 30,
      max: 200
    },
    respiratoryRate: {
      type: Number,
      min: 5,
      max: 50
    }
  },
  triageResult: {
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent', 'emergency'],
      required: true
    },
    recommendation: {
      type: String,
      required: true,
      maxlength: [1000, 'Recommendation cannot exceed 1000 characters']
    },
    suggestedAction: {
      type: String,
      enum: ['self-care', 'schedule-appointment', 'urgent-care', 'emergency-room'],
      required: true
    },
    timeToSeekCare: {
      type: String,
      enum: ['immediately', 'within-hours', 'within-days', 'routine'],
      required: true
    }
  },
  riskFactors: [{
    type: String,
    trim: true
  }],
  medicalHistory: [{
    condition: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['active', 'resolved', 'chronic'],
      required: true
    }
  }],
  medications: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    dosage: String,
    frequency: String
  }],
  allergies: [{
    type: String,
    trim: true
  }],
  triageScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  doctorReview: {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: {
      type: String,
      maxlength: [1000, 'Doctor notes cannot exceed 1000 characters']
    },
    confirmedDiagnosis: {
      type: String,
      maxlength: [1000, 'Confirmed diagnosis cannot exceed 1000 characters']
    },
    confirmedPriority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent', 'emergency']
    },
    reviewedAt: {
      type: Date
    }
  }
}, {
  timestamps: true
});

// Index for better query performance
triageSchema.index({ patient: 1, createdAt: -1 });
triageSchema.index({ 'triageResult.priority': 1 });
triageSchema.index({ triageScore: 1 });
triageSchema.index({ isCompleted: 1 });

// Virtual for determining if triage is urgent
triageSchema.virtual('isUrgent').get(function() {
  return ['urgent', 'emergency'].includes(this.triageResult.priority);
});

// Virtual for determining if triage requires immediate attention
triageSchema.virtual('requiresImmediateAttention').get(function() {
  return this.triageResult.timeToSeekCare === 'immediately' || 
         this.triageResult.suggestedAction === 'emergency-room';
});

// Method to calculate triage score based on symptoms and vital signs
triageSchema.methods.calculateTriageScore = function() {
  let score = 0;
  
  // Base score from pain level
  score += this.painLevel * 5;
  
  // Add points for severe symptoms
  this.symptoms.forEach(symptom => {
    if (symptom.severity === 'severe') score += 15;
    else if (symptom.severity === 'moderate') score += 8;
    else score += 3;
  });
  
  // Add points for abnormal vital signs
  if (this.vitalSigns.temperature) {
    if (this.vitalSigns.temperature > 39 || this.vitalSigns.temperature < 36) score += 10;
  }
  
  if (this.vitalSigns.bloodPressure) {
    const { systolic, diastolic } = this.vitalSigns.bloodPressure;
    if (systolic > 180 || systolic < 90 || diastolic > 110 || diastolic < 60) score += 15;
  }
  
  if (this.vitalSigns.heartRate) {
    if (this.vitalSigns.heartRate > 120 || this.vitalSigns.heartRate < 50) score += 10;
  }
  
  // Add points for risk factors
  score += this.riskFactors.length * 5;
  
  // Cap the score at 100
  return Math.min(score, 100);
};

// Method to determine priority based on score
triageSchema.methods.determinePriority = function() {
  const score = this.triageScore;
  
  if (score >= 80) return 'emergency';
  if (score >= 60) return 'urgent';
  if (score >= 40) return 'high';
  if (score >= 20) return 'medium';
  return 'low';
};

// Method to generate recommendation based on symptoms
triageSchema.methods.generateRecommendation = function() {
  const symptoms = this.symptoms.map(s => s.name.toLowerCase());
  const priority = this.triageResult.priority;
  
  // Emergency cases
  if (symptoms.includes('chest pain') && symptoms.includes('shortness of breath')) {
    return 'Chest pain with shortness of breath may indicate a serious cardiac condition. Seek emergency medical attention immediately.';
  }
  
  if (symptoms.includes('severe headache') && symptoms.includes('vision problems')) {
    return 'Severe headache with vision problems may indicate a serious neurological condition. Seek emergency care immediately.';
  }
  
  // Urgent cases
  if (symptoms.includes('fever') && symptoms.includes('cough') && this.vitalSigns.temperature > 38.5) {
    return 'High fever with cough may indicate a respiratory infection. Schedule an urgent appointment or visit urgent care.';
  }
  
  if (symptoms.includes('abdominal pain') && this.painLevel > 7) {
    return 'Severe abdominal pain requires prompt medical evaluation. Schedule an urgent appointment.';
  }
  
  // Routine cases
  if (symptoms.includes('headache') && symptoms.includes('sensitivity to light')) {
    return 'Headache with light sensitivity may indicate a migraine. Consider over-the-counter pain relief and schedule a routine appointment if symptoms persist.';
  }
  
  if (symptoms.includes('fever') && symptoms.includes('cough')) {
    return 'Fever with cough may indicate a common cold or flu. Rest, fluids, and over-the-counter medications may help. Schedule an appointment if symptoms worsen or persist.';
  }
  
  // Default recommendation based on priority
  switch (priority) {
    case 'emergency':
      return 'This appears to be a medical emergency. Please go to the nearest emergency room immediately or call emergency services.';
    case 'urgent':
      return 'Your symptoms require urgent medical attention. Please schedule an urgent appointment or visit urgent care within 24 hours.';
    case 'high':
      return 'Your symptoms require prompt medical evaluation. Please schedule an appointment within 2-3 days.';
    case 'medium':
      return 'Your symptoms should be evaluated by a healthcare provider. Please schedule an appointment within a week.';
    default:
      return 'Your symptoms appear mild. Monitor your condition and schedule an appointment if symptoms worsen or persist.';
  }
};

module.exports = mongoose.model('Triage', triageSchema);









