const mongoose = require('mongoose');

const callSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  caller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  callee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  status: { 
    type: String, 
    enum: ['initiated', 'ongoing', 'completed', 'missed', 'declined'],
    default: 'initiated'
  },
  type: { type: String, enum: ['video', 'audio'], default: 'video' }
}, { timestamps: true });

module.exports = mongoose.model('CallSession', callSessionSchema);