const mongoose = require('mongoose');

const callNoteSchema = new mongoose.Schema({
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'CallSession', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  timestamp: { type: Number, required: true }, // Timestamp in seconds from call start
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CallNote', callNoteSchema);