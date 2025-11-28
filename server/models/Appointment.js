const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient is required']
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor is required']
  },
  appointmentDate: {
    type: Date,
    required: [true, 'Appointment date is required']
  },
  appointmentTime: {
    type: String,
    required: [true, 'Appointment time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)']
  },
  duration: {
    type: Number,
    default: 30, // in minutes
    min: [15, 'Duration must be at least 15 minutes'],
    max: [120, 'Duration cannot exceed 120 minutes']
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  type: {
    type: String,
    enum: ['consultation', 'follow-up', 'emergency', 'routine'],
    default: 'consultation'
  },
  reason: {
    type: String,
    required: [true, 'Reason for appointment is required'],
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  symptoms: [{
    type: String,
    trim: true
  }],
  latestTriage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Triage',
    default: null
  },
  // Doctor's consultation notes
  doctorNotes: {
    type: String,
    maxlength: [2000, 'Doctor notes cannot exceed 2000 characters']
  },
  // Patient notes (before consultation)
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  // Confirmed diagnosis by doctor
  confirmedDiagnosis: {
    type: String,
    maxlength: [1000, 'Confirmed diagnosis cannot exceed 1000 characters']
  },
  // Initial diagnosis (from triage or patient)
  diagnosis: {
    type: String,
    maxlength: [500, 'Diagnosis cannot exceed 500 characters']
  },
  // Vitals recorded during consultation
  vitals: {
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
    },
    oxygenSaturation: {
      type: Number,
      min: 0,
      max: 100
    },
    weight: {
      type: Number,
      min: 0
    },
    height: {
      type: Number,
      min: 0
    },
    recordedAt: {
      type: Date,
      default: Date.now
    }
  },
  prescription: [{
    medication: {
      type: String,
      required: true
    },
    dosage: {
      type: String,
      required: true
    },
    frequency: {
      type: String,
      required: true
    },
    duration: {
      type: String,
      required: true
    }
  }],
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: {
    type: Date
  },
  triageScore: {
    type: Number,
    min: 1,
    max: 10
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  meetingLink: {
    type: String
  },
  isVirtual: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better query performance
appointmentSchema.index({ patient: 1, appointmentDate: 1 });
appointmentSchema.index({ doctor: 1, appointmentDate: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ appointmentDate: 1, appointmentTime: 1 });

// Virtual for checking if appointment is in the past
appointmentSchema.virtual('isPast').get(function() {
  const appointmentDateTime = new Date(`${this.appointmentDate.toDateString()} ${this.appointmentTime}`);
  return appointmentDateTime < new Date();
});

// Virtual for checking if appointment is today
appointmentSchema.virtual('isToday').get(function() {
  const today = new Date();
  const appointmentDate = new Date(this.appointmentDate);
  return appointmentDate.toDateString() === today.toDateString();
});

// Method to check if appointment can be cancelled
appointmentSchema.methods.canBeCancelled = function() {
  const appointmentDateTime = new Date(`${this.appointmentDate.toDateString()} ${this.appointmentTime}`);
  const hoursUntilAppointment = (appointmentDateTime - new Date()) / (1000 * 60 * 60);
  return hoursUntilAppointment > 2 && this.status === 'scheduled';
};

// Method to check if appointment can be rescheduled
appointmentSchema.methods.canBeRescheduled = function() {
  const appointmentDateTime = new Date(`${this.appointmentDate.toDateString()} ${this.appointmentTime}`);
  const hoursUntilAppointment = (appointmentDateTime - new Date()) / (1000 * 60 * 60);
  return hoursUntilAppointment > 24 && ['scheduled', 'confirmed'].includes(this.status);
};

module.exports = mongoose.model('Appointment', appointmentSchema);









