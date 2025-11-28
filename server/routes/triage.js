const express = require('express');
const Triage = require('../models/Triage');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { validateTriage, validateObjectId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// @desc    Submit triage form
// @route   POST /api/triage
// @access  Private
router.post('/', protect, validateTriage, async (req, res) => {
  try {
    const { symptoms, painLevel, vitalSigns, riskFactors, medicalHistory, medications, allergies } = req.body;

    // Create triage instance
    const triage = new Triage({
      patient: req.user._id,
      symptoms,
      painLevel,
      vitalSigns,
      riskFactors: riskFactors || [],
      medicalHistory: medicalHistory || [],
      medications: medications || [],
      allergies: allergies || []
    });

    // Calculate triage score
    triage.triageScore = triage.calculateTriageScore();
    
    // Determine priority
    const priority = triage.determinePriority();
    triage.triageResult = {
      priority,
      recommendation: triage.generateRecommendation(),
      suggestedAction: getSuggestedAction(priority),
      timeToSeekCare: getTimeToSeekCare(priority)
    };

    await triage.save();

    // Populate patient info
    await triage.populate('patient', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Triage assessment completed',
      data: triage
    });
  } catch (error) {
    console.error('Triage submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during triage assessment'
    });
  }
});

// @desc    Get triage history for patient
// @route   GET /api/triage/patient/:patientId
// @access  Private
router.get('/patient/:patientId', protect, validateObjectId('patientId'), async (req, res) => {
  try {
    const { patientId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Check if user has access to this patient's data
    if (req.user.role === 'patient' && req.user._id.toString() !== patientId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const triages = await Triage.find({ patient: patientId })
      .populate('patient', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Triage.countDocuments({ patient: patientId });

    res.json({
      success: true,
      count: triages.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: triages
    });
  } catch (error) {
    console.error('Get triage history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching triage history'
    });
  }
});

// @desc    Get single triage assessment
// @route   GET /api/triage/:id
// @access  Private
router.get('/:id', protect, validateObjectId('id'), async (req, res) => {
  try {
    const triage = await Triage.findById(req.params.id)
      .populate('patient', 'name email phone dateOfBirth gender');

    if (!triage) {
      return res.status(404).json({
        success: false,
        message: 'Triage assessment not found'
      });
    }

    // Check if user has access to this triage
    if (req.user.role === 'patient' && triage.patient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: triage
    });
  } catch (error) {
    console.error('Get triage error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching triage assessment'
    });
  }
});

// @desc    Update triage assessment (for doctors)
// @route   PUT /api/triage/:id
// @access  Private (Doctor/Admin)
router.put('/:id', protect, authorize('doctor', 'admin'), validateObjectId('id'), async (req, res) => {
  try {
    const { notes, followUpRequired, followUpDate, isCompleted } = req.body;

    const triage = await Triage.findById(req.params.id);

    if (!triage) {
      return res.status(404).json({
        success: false,
        message: 'Triage assessment not found'
      });
    }

    // Update triage
    if (notes !== undefined) triage.notes = notes;
    if (followUpRequired !== undefined) triage.followUpRequired = followUpRequired;
    if (followUpDate !== undefined) triage.followUpDate = followUpDate;
    if (isCompleted !== undefined) triage.isCompleted = isCompleted;

    await triage.save();

    // Populate patient info before returning
    await triage.populate('patient', 'name email phone');

    res.json({
      success: true,
      message: 'Triage assessment updated successfully',
      data: triage
    });
  } catch (error) {
    console.error('Update triage error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating triage assessment'
    });
  }
});

// @desc    Add doctor's notes to triage assessment
// @route   POST /api/triage/:id/doctor-notes
// @access  Private (Doctor)
router.post('/:id/doctor-notes', protect, authorize('doctor'), validateObjectId('id'), async (req, res) => {
  try {
    const { doctorNotes, confirmedDiagnosis, confirmedPriority } = req.body;

    const triage = await Triage.findById(req.params.id)
      .populate('patient', 'name email phone');

    if (!triage) {
      return res.status(404).json({
        success: false,
        message: 'Triage assessment not found'
      });
    }

    // Add doctor's review
    triage.doctorReview = {
      doctor: req.user._id,
      notes: doctorNotes,
      confirmedDiagnosis: confirmedDiagnosis || triage.triageResult.recommendation,
      confirmedPriority: confirmedPriority || triage.triageResult.priority,
      reviewedAt: new Date()
    };

    await triage.save();

    res.json({
      success: true,
      message: 'Doctor notes added successfully',
      data: triage
    });
  } catch (error) {
    console.error('Add doctor notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding doctor notes'
    });
  }
});

// @desc    Get urgent triage cases
// @route   GET /api/triage/urgent
// @access  Private (Doctor/Admin)
router.get('/urgent', protect, authorize('doctor', 'admin'), validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const urgentTriages = await Triage.find({
      'triageResult.priority': { $in: ['urgent', 'emergency'] },
      isCompleted: false
    })
    .populate('patient', 'name email phone')
    .sort({ triageScore: -1, createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Triage.countDocuments({
      'triageResult.priority': { $in: ['urgent', 'emergency'] },
      isCompleted: false
    });

    res.json({
      success: true,
      count: urgentTriages.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: urgentTriages
    });
  } catch (error) {
    console.error('Get urgent triages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching urgent triage cases'
    });
  }
});

// @desc    Get triage statistics
// @route   GET /api/triage/stats
// @access  Private (Admin)
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const filter = {};
    if (startDate) filter.createdAt = { $gte: new Date(startDate) };
    if (endDate) {
      filter.createdAt = { 
        ...filter.createdAt, 
        $lte: new Date(endDate) 
      };
    }

    const stats = await Triage.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$triageResult.priority',
          count: { $sum: 1 },
          avgScore: { $avg: '$triageScore' }
        }
      }
    ]);

    const totalTriages = await Triage.countDocuments(filter);
    const urgentTriages = await Triage.countDocuments({
      ...filter,
      'triageResult.priority': { $in: ['urgent', 'emergency'] }
    });
    const completedTriages = await Triage.countDocuments({
      ...filter,
      isCompleted: true
    });

    res.json({
      success: true,
      data: {
        total: totalTriages,
        urgent: urgentTriages,
        completed: completedTriages,
        byPriority: stats.reduce((acc, stat) => {
          acc[stat._id] = {
            count: stat.count,
            avgScore: Math.round(stat.avgScore * 100) / 100
          };
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Get triage stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching triage statistics'
    });
  }
});

// Helper functions
function getSuggestedAction(priority) {
  switch (priority) {
    case 'emergency':
      return 'emergency-room';
    case 'urgent':
      return 'urgent-care';
    case 'high':
      return 'schedule-appointment';
    default:
      return 'self-care';
  }
}

function getTimeToSeekCare(priority) {
  switch (priority) {
    case 'emergency':
      return 'immediately';
    case 'urgent':
      return 'within-hours';
    case 'high':
      return 'within-days';
    default:
      return 'routine';
  }
}

module.exports = router;









