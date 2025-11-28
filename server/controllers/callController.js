// controllers/callController.js
const Call = require('../models/Call');
const User = require('../models/User');

// @desc    Get call history for a user
// @route   GET /api/calls/history/:userId
// @access  Private
const getCallHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Verify the requesting user has access to this data
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to access this resource' 
      });
    }

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { startTime: -1 },
      populate: [
        { path: 'callerId', select: 'name email avatar' },
        { path: 'calleeId', select: 'name email avatar' }
      ]
    };

    const query = {
      $or: [
        { callerId: userId },
        { calleeId: userId }
      ]
    };

    const calls = await Call.paginate(query, options);

    // Format the response
    const formattedCalls = {
      ...calls,
      docs: calls.docs.map(call => ({
        id: call._id,
        type: call.type,
        status: call.status,
        duration: call.duration,
        date: call.startTime,
        participants: [
          call.callerId?._id.toString() === userId 
            ? 'You' 
            : call.callerId?.name || 'Unknown',
          call.calleeId?._id.toString() === userId 
            ? 'You' 
            : call.calleeId?.name || 'Unknown'
        ].filter(Boolean)
      }))
    };

    res.json({
      success: true,
      data: formattedCalls
    });
  } catch (error) {
    console.error('Error fetching call history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// @desc    Create a new call record
// @route   POST /api/calls
// @access  Private
const createCall = async (req, res) => {
  try {
    const { callerId, calleeId, type, sessionId } = req.body;

    const call = new Call({
      callerId,
      calleeId,
      type: type || 'video',
      status: 'initiated',
      sessionId
    });

    await call.save();

    // Populate user details
    await call.populate('callerId calleeId', 'name email avatar');

    res.status(201).json({
      success: true,
      data: call
    });
  } catch (error) {
    console.error('Error creating call:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating call',
      error: error.message 
    });
  }
};

// @desc    Update call status
// @route   PUT /api/calls/:callId
// @access  Private
const updateCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const { status, duration } = req.body;

    const updates = {};
    if (status) updates.status = status;
    if (duration) updates.duration = duration;
    updates.endTime = Date.now();

    const call = await Call.findByIdAndUpdate(
      callId,
      { $set: updates },
      { new: true }
    ).populate('callerId calleeId', 'name email avatar');

    if (!call) {
      return res.status(404).json({ 
        success: false, 
        message: 'Call not found' 
      });
    }

    res.json({
      success: true,
      data: call
    });
  } catch (error) {
    console.error('Error updating call:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating call',
      error: error.message 
    });
  }
};

module.exports = {
  getCallHistory,
  createCall,
  updateCall
};