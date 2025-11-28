const express = require('express');
const Appointment = require('../models/Appointment');
const Triage = require('../models/Triage');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');

const router = express.Router();

// @desc    Get doctor profile
// @route   GET /api/doctor/profile
// @access  Private (Doctor)
router.get('/profile', protect, authorize('doctor'), async (req, res) => {
  try {
    const doctor = await User.findById(req.user._id).select('-password');
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      data: doctor
    });
  } catch (error) {
    console.error('Get doctor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
});

// @desc    Update doctor profile
// @route   PUT /api/doctor/profile
// @access  Private (Doctor)
router.put('/profile', protect, authorize('doctor'), async (req, res) => {
  try {
    const {
      name,
      phone,
      bio,
      specialization,
      qualifications,
      experience,
      licenseNumber,
      availability,
      consultationFee
    } = req.body;

    const doctor = await User.findById(req.user._id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Update fields
    if (name) doctor.name = name;
    if (phone) doctor.phone = phone;
    if (bio !== undefined) doctor.bio = bio;
    if (specialization) doctor.specialization = specialization;
    if (qualifications) doctor.qualifications = qualifications;
    if (experience !== undefined) doctor.experience = experience;
    if (licenseNumber) doctor.licenseNumber = licenseNumber;
    if (availability) doctor.availability = availability;
    if (consultationFee !== undefined) doctor.consultationFee = consultationFee;

    await doctor.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: doctor.getProfile()
    });
  } catch (error) {
    console.error('Update doctor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
});

// @desc    Get doctor's appointments with triage data
// @route   GET /api/doctor/appointments
// @access  Private (Doctor)
router.get('/appointments', protect, authorize('doctor'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, date } = req.query;
    const skip = (page - 1) * limit;

    const filter = { doctor: req.user._id };
    if (status) filter.status = status;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.appointmentDate = { $gte: startDate, $lt: endDate };
    }

    const appointments = await Appointment.find(filter)
      .populate('patient', 'name email phone dateOfBirth gender')
      .populate('latestTriage')
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(filter);

    res.json({
      success: true,
      count: appointments.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: appointments
    });
  } catch (error) {
    console.error('Get doctor appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching appointments'
    });
  }
});

// @desc    Get single appointment details with full triage info
// @route   GET /api/doctor/appointments/:id
// @access  Private (Doctor)
router.get('/appointments/:id', protect, authorize('doctor'), validateObjectId('id'), async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      doctor: req.user._id
    })
      .populate('patient', 'name email phone dateOfBirth gender address')
      .populate('latestTriage')
      .populate('doctor', 'name specialization');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Get patient's triage history
    const triageHistory = await Triage.find({ patient: appointment.patient._id })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        appointment,
        triageHistory
      }
    });
  } catch (error) {
    console.error('Get appointment details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching appointment details'
    });
  }
});

// @desc    Update appointment with doctor notes, vitals, diagnosis
// @route   PATCH /api/doctor/appointments/:id/notes
// @access  Private (Doctor)
router.patch('/appointments/:id/notes', protect, authorize('doctor'), validateObjectId('id'), async (req, res) => {
  try {
    const { doctorNotes, confirmedDiagnosis, vitals, status } = req.body;

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      doctor: req.user._id
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Update fields
    if (doctorNotes !== undefined) appointment.doctorNotes = doctorNotes;
    if (confirmedDiagnosis !== undefined) appointment.confirmedDiagnosis = confirmedDiagnosis;
    if (vitals) appointment.vitals = { ...appointment.vitals, ...vitals, recordedAt: new Date() };
    if (status) appointment.status = status;

    await appointment.save();

    await appointment.populate('patient', 'name email phone');
    await appointment.populate('latestTriage');

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Update appointment notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating appointment'
    });
  }
});

// @desc    Add or update prescription
// @route   POST /api/doctor/appointments/:id/prescription
// @access  Private (Doctor)
router.post('/appointments/:id/prescription', protect, authorize('doctor'), validateObjectId('id'), async (req, res) => {
  try {
    const { prescription } = req.body;

    if (!prescription || !Array.isArray(prescription)) {
      return res.status(400).json({
        success: false,
        message: 'Prescription must be an array'
      });
    }

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      doctor: req.user._id
    })
      .populate('patient', 'name email phone dateOfBirth gender')
      .populate('doctor', 'name specialization licenseNumber');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    appointment.prescription = prescription;
    await appointment.save();

    res.json({
      success: true,
      message: 'Prescription saved successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Save prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while saving prescription'
    });
  }
});

// @desc    Get doctor analytics
// @route   GET /api/doctor/analytics
// @access  Private (Doctor)
router.get('/analytics', protect, authorize('doctor'), async (req, res) => {
  try {
    const doctorId = req.user._id;

    // Total patients treated (unique patients with completed appointments)
    const totalPatients = await Appointment.distinct('patient', {
      doctor: doctorId,
      status: 'completed'
    });

    // Total appointments by status
    const appointmentsByStatus = await Appointment.aggregate([
      { $match: { doctor: doctorId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Appointments this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const appointmentsThisMonth = await Appointment.countDocuments({
      doctor: doctorId,
      createdAt: { $gte: startOfMonth }
    });

    // Get top 5 common conditions from confirmed diagnoses
    const commonConditions = await Appointment.aggregate([
      {
        $match: {
          doctor: doctorId,
          confirmedDiagnosis: { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$confirmedDiagnosis',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Urgency case distribution from linked triages
    const urgencyDistribution = await Appointment.aggregate([
      {
        $match: {
          doctor: doctorId,
          latestTriage: { $exists: true, $ne: null }
        }
      },
      {
        $lookup: {
          from: 'triages',
          localField: 'latestTriage',
          foreignField: '_id',
          as: 'triageData'
        }
      },
      { $unwind: '$triageData' },
      {
        $group: {
          _id: '$triageData.triageResult.priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Appointments per day for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const appointmentsPerDay = await Appointment.aggregate([
      {
        $match: {
          doctor: doctorId,
          appointmentDate: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$appointmentDate' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalPatients: totalPatients.length,
        appointmentsByStatus,
        appointmentsThisMonth,
        commonConditions,
        urgencyDistribution,
        appointmentsPerDay
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analytics'
    });
  }
});

// @desc    Get patient details and history
// @route   GET /api/doctor/patients/:id
// @access  Private (Doctor)
router.get('/patients/:id', protect, authorize('doctor'), validateObjectId('id'), async (req, res) => {
  try {
    const patient = await User.findById(req.params.id).select('-password');

    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Get patient's appointment history with this doctor
    const appointments = await Appointment.find({
      patient: req.params.id,
      doctor: req.user._id
    })
      .sort({ appointmentDate: -1 })
      .limit(10);

    // Get patient's triage history
    const triageHistory = await Triage.find({
      patient: req.params.id
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        patient,
        appointments,
        triageHistory
      }
    });
  } catch (error) {
    console.error('Get patient details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching patient details'
    });
  }
});

module.exports = router;
