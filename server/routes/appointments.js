const express = require('express');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Triage = require('../models/Triage');
const { protect, authorize } = require('../middleware/auth');
const { validateAppointment, validateAppointmentUpdate, validateObjectId, validatePagination, validateDateRange } = require('../middleware/validation');

const router = express.Router();

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private
router.get('/', protect, validatePagination, validateDateRange, async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate, status, doctor, patient } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    // Role-based filtering
    if (req.user.role === 'patient') {
      filter.patient = req.user._id;
    } else if (req.user.role === 'doctor') {
      filter.doctor = req.user._id;
    }

    // Additional filters
    if (status) filter.status = status;
    if (doctor) filter.doctor = doctor;
    if (patient) filter.patient = patient;

    // Date range filtering
    if (startDate || endDate) {
      filter.appointmentDate = {};
      if (startDate) filter.appointmentDate.$gte = new Date(startDate);
      if (endDate) filter.appointmentDate.$lte = new Date(endDate);
    }

    const appointments = await Appointment.find(filter)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email specialization')
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
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching appointments'
    });
  }
});

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
router.get('/:id', protect, validateObjectId('id'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name email phone dateOfBirth gender')
      .populate('doctor', 'name email specialization phone');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if user has access to this appointment
    if (req.user.role === 'patient' && appointment.patient._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (req.user.role === 'doctor' && appointment.doctor._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching appointment'
    });
  }
});

// @desc    Create new appointment
// @route   POST /api/appointments
// @access  Private
router.post('/', protect, validateAppointment, async (req, res) => {
  try {
    const { doctor, appointmentDate, appointmentTime, reason, type, symptoms } = req.body;

    // Check if doctor exists and is active
    const doctorUser = await User.findOne({ _id: doctor, role: 'doctor', isActive: true });
    if (!doctorUser) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found or inactive'
      });
    }

    // Check for conflicting appointments
    const conflictingAppointment = await Appointment.findOne({
      doctor,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      status: { $in: ['scheduled', 'confirmed'] }
    });

    if (conflictingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'Doctor has a conflicting appointment at this time'
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      reason,
      type: type || 'consultation',
      symptoms: symptoms || []
    });

    // Populate the created appointment
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email specialization');

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: populatedAppointment
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating appointment'
    });
  }
});

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
router.put('/:id', protect, validateObjectId('id'), validateAppointmentUpdate, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if user has permission to update
    if (req.user.role === 'patient' && appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (req.user.role === 'doctor' && appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if appointment can be updated
    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update completed or cancelled appointment'
      });
    }

    // Update appointment
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('patient', 'name email phone')
     .populate('doctor', 'name email specialization');

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: updatedAppointment
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating appointment'
    });
  }
});

// @desc    Cancel appointment
// @route   DELETE /api/appointments/:id
// @access  Private
router.delete('/:id', protect, validateObjectId('id'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if user has permission to cancel
    if (req.user.role === 'patient' && appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (req.user.role === 'doctor' && appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if appointment can be cancelled
    if (!appointment.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: 'Appointment cannot be cancelled (too close to appointment time or already processed)'
      });
    }

    // Cancel appointment
    appointment.status = 'cancelled';
    await appointment.save();

    res.json({
      success: true,
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling appointment'
    });
  }
});

// @desc    Get available time slots for a doctor
// @route   GET /api/appointments/available/:doctorId
// @access  Private
router.get('/available/:doctorId', protect, validateObjectId('doctorId'), async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    const appointmentDate = new Date(date);
    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get existing appointments for the day
    const existingAppointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $in: ['scheduled', 'confirmed'] }
    });

    // Generate available time slots (9 AM to 5 PM, 30-minute intervals)
    const availableSlots = [];
    const startHour = 9;
    const endHour = 17;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Check if this slot is available
        const isBooked = existingAppointments.some(apt => apt.appointmentTime === timeString);
        
        if (!isBooked) {
          availableSlots.push(timeString);
        }
      }
    }

    res.json({
      success: true,
      date: appointmentDate.toISOString().split('T')[0],
      availableSlots
    });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching available slots'
    });
  }
});

// @desc    Get doctor's appointments with triage data
// @route   GET /api/appointments/doctor/with-triage
// @access  Private (Doctor)
router.get('/doctor/with-triage', protect, authorize('doctor'), validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    // Build filter for doctor's appointments
    const filter = { doctor: req.user._id };
    if (status) filter.status = status;

    // Get appointments
    const appointments = await Appointment.find(filter)
      .populate('patient', 'name email phone dateOfBirth gender')
      .populate('doctor', 'name email specialization')
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // For each appointment, get the latest triage for that patient
    const appointmentsWithTriage = await Promise.all(
      appointments.map(async (appointment) => {
        const latestTriage = await Triage.findOne({ 
          patient: appointment.patient._id 
        })
        .sort({ createdAt: -1 })
        .limit(1);

        return {
          ...appointment.toObject(),
          latestTriage: latestTriage || null
        };
      })
    );

    const total = await Appointment.countDocuments(filter);

    res.json({
      success: true,
      count: appointmentsWithTriage.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: appointmentsWithTriage
    });
  } catch (error) {
    console.error('Get appointments with triage error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching appointments with triage data'
    });
  }
});

// @desc    Get appointment statistics
// @route   GET /api/appointments/stats
// @access  Private (Admin/Doctor)
router.get('/stats', protect, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const filter = {};
    if (startDate) filter.appointmentDate = { $gte: new Date(startDate) };
    if (endDate) {
      filter.appointmentDate = { 
        ...filter.appointmentDate, 
        $lte: new Date(endDate) 
      };
    }

    // Role-based filtering
    if (req.user.role === 'doctor') {
      filter.doctor = req.user._id;
    }

    const stats = await Appointment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalAppointments = await Appointment.countDocuments(filter);
    const todayAppointments = await Appointment.countDocuments({
      ...filter,
      appointmentDate: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lte: new Date(new Date().setHours(23, 59, 59, 999))
      }
    });

    res.json({
      success: true,
      data: {
        total: totalAppointments,
        today: todayAppointments,
        byStatus: stats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Get appointment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching appointment statistics'
    });
  }
});

module.exports = router;









