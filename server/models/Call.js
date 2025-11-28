// models/Call.js
const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  callerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  calleeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['video', 'audio'],
    default: 'video'
  },
  status: {
    type: String,
    enum: ['completed', 'missed', 'declined', 'cancelled'],
    required: true
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  sessionId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
callSchema.index({ callerId: 1, startTime: -1 });
callSchema.index({ calleeId: 1, startTime: -1 });

module.exports = mongoose.model('Call', callSchema);