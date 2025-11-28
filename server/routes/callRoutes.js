// routes/callRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getCallHistory,
  createCall,
  updateCall
} = require('../controllers/callController');

// Apply protect middleware to all routes
router.use(protect);

// Define routes
router.get('/history/:userId', getCallHistory);
router.post('/', createCall);
router.put('/:callId', updateCall);

module.exports = router;