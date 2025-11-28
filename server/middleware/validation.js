const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('Validation errors:', JSON.stringify(errors.array(), null, 2));
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('role')
    .optional()
    .isIn(['patient', 'doctor', 'admin'])
    .withMessage('Role must be patient, doctor, or admin'),
  body('specialization')
    .if(body('role').equals('doctor'))
    .notEmpty()
    .withMessage('Specialization is required for doctors'),
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

const validatePasswordReset = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  handleValidationErrors
];

const validatePasswordUpdate = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
  handleValidationErrors
];

// Appointment validation rules
const validateAppointment = [
  body('doctor')
    .isMongoId()
    .withMessage('Please provide a valid doctor ID'),
  body('appointmentDate')
    .isISO8601()
    .withMessage('Please provide a valid appointment date')
    .custom((value) => {
      const appointmentDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (appointmentDate < today) {
        throw new Error('Appointment date cannot be in the past');
      }
      return true;
    }),
  body('appointmentTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide a valid time format (HH:MM)'),
  body('reason')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters'),
  body('type')
    .optional()
    .isIn(['consultation', 'follow-up', 'emergency', 'routine'])
    .withMessage('Type must be consultation, follow-up, emergency, or routine'),
  handleValidationErrors
];

const validateAppointmentUpdate = [
  body('appointmentDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid appointment date'),
  body('appointmentTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide a valid time format (HH:MM)'),
  body('status')
    .optional()
    .isIn(['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'])
    .withMessage('Invalid status'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  handleValidationErrors
];

// Triage validation rules
const validateTriage = [
  body('symptoms')
    .isArray({ min: 1 })
    .withMessage('At least one symptom is required'),
  body('symptoms.*.name')
    .trim()
    .notEmpty()
    .withMessage('Symptom name is required'),
  body('symptoms.*.severity')
    .isIn(['mild', 'moderate', 'severe'])
    .withMessage('Symptom severity must be mild, moderate, or severe'),
  body('symptoms.*.duration')
    .trim()
    .notEmpty()
    .withMessage('Symptom duration is required'),
  body('painLevel')
    .isInt({ min: 0, max: 10 })
    .withMessage('Pain level must be between 0 and 10'),
  body('vitalSigns')
    .optional()
    .isObject()
    .withMessage('Vital signs must be an object'),
  body('vitalSigns.temperature')
    .optional({ checkFalsy: true })
    .isFloat({ min: 30, max: 45 })
    .withMessage('Temperature must be between 30°C and 45°C'),
  body('vitalSigns.bloodPressure')
    .optional()
    .isObject()
    .withMessage('Blood pressure must be an object'),
  body('vitalSigns.bloodPressure.systolic')
    .if(body('vitalSigns.bloodPressure').exists())
    .optional({ checkFalsy: true })
    .isInt({ min: 50, max: 250 })
    .withMessage('Systolic blood pressure must be between 50 and 250'),
  body('vitalSigns.bloodPressure.diastolic')
    .if(body('vitalSigns.bloodPressure').exists())
    .optional({ checkFalsy: true })
    .isInt({ min: 30, max: 150 })
    .withMessage('Diastolic blood pressure must be between 30 and 150'),
  body('vitalSigns.heartRate')
    .optional({ checkFalsy: true })
    .isInt({ min: 30, max: 200 })
    .withMessage('Heart rate must be between 30 and 200'),
  body('vitalSigns.respiratoryRate')
    .optional({ checkFalsy: true })
    .isInt({ min: 5, max: 50 })
    .withMessage('Respiratory rate must be between 5 and 50'),
  body('riskFactors')
    .optional()
    .isArray()
    .withMessage('Risk factors must be an array'),
  body('medicalHistory')
    .optional()
    .isArray()
    .withMessage('Medical history must be an array'),
  body('medications')
    .optional()
    .isArray()
    .withMessage('Medications must be an array'),
  body('allergies')
    .optional()
    .isArray()
    .withMessage('Allergies must be an array'),
  handleValidationErrors
];

// Parameter validation
const validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} ID format`),
  handleValidationErrors
];

// Query validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (req.query.startDate && new Date(value) < new Date(req.query.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validatePasswordReset,
  validatePasswordUpdate,
  validateAppointment,
  validateAppointmentUpdate,
  validateTriage,
  validateObjectId,
  validatePagination,
  validateDateRange
};









