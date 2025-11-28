require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const callRoutes = require('./routes/callRoutes');
const authRoutes = require('./routes/auth');
const CallNote = require('./models/CallNote');

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CLIENT_URL 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('dev'));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthlink', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', require('./routes/users'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/triage', require('./routes/triage'));
app.use('/api/doctor', require('./routes/doctor'));
app.use('/api/calls', callRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'HealthLink API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Store active calls and user sessions
const activeCalls = new Map();
const userSessions = new Map();
const rooms = new Map();

const server = http.createServer(app);

// Socket.IO configuration
const io = socketIo(server, {
  cors: {
    ...corsOptions,
    transports: ['websocket', 'polling'],
    allowUpgrades: true
  },
  path: '/socket.io/',
  pingTimeout: 30000,
  pingInterval: 10000,
  cookie: false,
  maxHttpBufferSize: 1e8,
  allowEIO3: true,
  transports: ['websocket', 'polling'],
  allowUpgrades: true
});

// Socket.IO error handling
io.engine.on('connection_error', (err) => {
  console.error('Socket.IO connection error:', {
    message: err.message,
    code: err.code,
    context: err.context,
    stack: err.stack
  });
});

io.engine.on('upgrade_error', (err) => {
  console.error('Socket.IO upgrade error:', {
    message: err.message,
    stack: err.stack
  });
});

// Track connection statistics
const stats = {
  connections: 0,
  peakConnections: 0,
  totalConnections: 0
};

// Helper function to leave a room
function leaveRoom(socket, room, userId = null) {
  if (!room) return;
  
  socket.leave(room);
  
  if (rooms.has(room)) {
    const roomData = rooms.get(room);
    const userData = roomData.get(socket.id);
    
    if (userData) {
      roomData.delete(socket.id);
      
      // Notify other users in the room
      socket.to(room).emit('user-left', {
        socketId: socket.id,
        userId: userId || userData.userId
      });
      
      console.log(`User ${userId || userData.userId} left room: ${room} (${roomData.size} users remaining)`);
    }
    
    // Clean up empty rooms
    if (roomData.size === 0) {
      rooms.delete(room);
      console.log(`Room ${room} is now empty and has been removed`);
    }
  }
}

// Helper function to end a call
function endCall(sessionId, userId, reason) {
  if (!sessionId) return;
  
  const call = activeCalls.get(sessionId);
  if (!call) return;
  
  // Notify all participants
  const participants = [...call.participants];
  const socketsToNotify = new Set();
  
  // Collect all participant sockets
  participants.forEach(participantId => {
    const userSession = userSessions.get(participantId);
    if (userSession?.socketId) {
      socketsToNotify.add(userSession.socketId);
    }
  });
  
  // Send end-call event to all participants
  const endCallEvent = { 
    sessionId, 
    reason,
    endedBy: userId,
    duration: new Date() - (call.startedAt || new Date())
  };
  
  socketsToNotify.forEach(socketId => {
    io.to(socketId).emit('call-ended', endCallEvent);
  });
  
  // Clean up
  activeCalls.delete(sessionId);
  
  // Update user sessions
  participants.forEach(participantId => {
    if (userSessions.has(participantId)) {
      const userData = userSessions.get(participantId);
      if (userData.currentCall === sessionId) {
        userSessions.set(participantId, {
          ...userData,
          currentCall: null
        });
      }
    }
  });
  
  console.log(`Call ${sessionId} ended: ${reason} (${participants.length} participants)`);
  
  // Save call details to database
  if (call.startedAt && participants.length > 0) {
    saveCallDetails(sessionId, call, reason, userId)
      .catch(err => console.error('Error saving call details:', err));
  }
}

// Helper function to save call details to the database
async function saveCallDetails(sessionId, call, reason, endedBy) {
  try {
    const callNote = new CallNote({
      sessionId,
      participants: call.participants,
      type: call.type,
      startedAt: call.startedAt,
      endedAt: new Date(),
      duration: new Date() - call.startedAt,
      status: reason.includes('rejected') ? 'rejected' : 'completed',
      endedBy,
      reason
    });
    
    await callNote.save();
    console.log(`Call ${sessionId} details saved to database`);
  } catch (error) {
    console.error('Error saving call details:', error);
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  stats.connections++;
  stats.totalConnections++;
  stats.peakConnections = Math.max(stats.peakConnections, stats.connections);
  
  console.log(`🔌 Client connected: ${socket.id} (${stats.connections} active, ${stats.totalConnections} total)`);

  // Store user information when they connect
  socket.on('register-user', ({ userId, userData }) => {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      userSessions.set(userId, {
        socketId: socket.id,
        userId,
        ...userData,
        connectedAt: new Date()
      });
      
      console.log(`👤 User ${userId} registered with socket ${socket.id}`);
      socket.emit('user-registered', { success: true, userId });
    } catch (error) {
      console.error('❌ Error registering user:', error);
      socket.emit('error', { 
        message: 'Failed to register user',
        details: error.message 
      });
    }
  });

  // Handle joining a room for WebRTC signaling
  socket.on('join-room', ({ room, userId, userData }) => {
    try {
      if (!room || !userId) {
        throw new Error('Room and user ID are required');
      }

      // Leave current room if any
      if (socket.rooms.size > 1) {
        const currentRoom = Array.from(socket.rooms).find(r => r !== socket.id);
        if (currentRoom) {
          leaveRoom(socket, currentRoom, userId);
        }
      }

      // Join the new room
      socket.join(room);
      
      // Initialize room if it doesn't exist
      if (!rooms.has(room)) {
        rooms.set(room, new Map());
      }
      
      const roomData = rooms.get(room);
      roomData.set(socket.id, { 
        userId, 
        userData,
        joinedAt: new Date()
      });
      
      console.log(`🏠 User ${userId} joined room: ${room} (${roomData.size} users in room)`);
      
      // Update user session with room info
      if (userSessions.has(userId)) {
        const userSession = userSessions.get(userId);
        userSessions.set(userId, {
          ...userSession,
          currentRoom: room,
          socketId: socket.id
        });
      }
      
      // Notify other users in the room
      socket.to(room).emit('user-joined', { 
        userId, 
        socketId: socket.id,
        userData,
        participants: Array.from(roomData.entries())
          .filter(([id]) => id !== socket.id)
          .map(([id, data]) => ({
            socketId: id,
            userId: data.userId,
            userData: data.userData
          }))
      });

      // Send current participants to the new user
      const participants = Array.from(roomData.entries())
        .filter(([id]) => id !== socket.id)
        .map(([id, data]) => ({
          socketId: id,
          userId: data.userId,
          userData: data.userData
        }));
      
      if (participants.length > 0) {
        socket.emit('room-joined', { 
          room,
          participants 
        });
      }
    } catch (error) {
      console.error('❌ Error joining room:', error);
      socket.emit('error', { 
        message: 'Failed to join room',
        details: error.message 
      });
    }
  });

  // Handle WebRTC offer
  socket.on('offer', (data) => {
    try {
      console.log('📤 Received offer from:', data.caller, 'to:', data.to);
      
      const targetUser = userSessions.get(data.to);
      if (!targetUser) {
        throw new Error(`Target user ${data.to} not found`);
      }
      
      // Forward the offer to the target user
      io.to(targetUser.socketId).emit('offer', data);
      console.log('📤 Forwarded offer to:', data.to);
    } catch (error) {
      console.error('❌ Error handling offer:', error);
      socket.emit('error', { 
        message: 'Failed to send offer',
        details: error.message 
      });
    }
  });

  // Handle WebRTC answer
  socket.on('answer', (data) => {
    try {
      console.log('📨 Received answer to:', data.to);
      
      const targetUser = userSessions.get(data.to);
      if (!targetUser) {
        throw new Error(`Target user ${data.to} not found`);
      }
      
      // Forward the answer to the target user
      io.to(targetUser.socketId).emit('answer', data);
      console.log('📨 Forwarded answer to:', data.to);
    } catch (error) {
      console.error('❌ Error handling answer:', error);
      socket.emit('error', { 
        message: 'Failed to send answer',
        details: error.message 
      });
    }
  });

  // Handle ICE candidates
  socket.on('ice-candidate', (data) => {
    try {
      console.log('🧊 Received ICE candidate to:', data.to);
      
      const targetUser = userSessions.get(data.to);
      if (!targetUser) {
        throw new Error(`Target user ${data.to} not found`);
      }
      
      // Forward the ICE candidate to the target user
      io.to(targetUser.socketId).emit('ice-candidate', {
        from: socket.id,
        candidate: data.candidate,
        sessionId: data.sessionId
      });
      console.log('🧊 Forwarded ICE candidate to:', data.to);
    } catch (error) {
      console.error('❌ Error handling ICE candidate:', error);
      socket.emit('error', { 
        message: 'Failed to send ICE candidate',
        details: error.message 
      });
    }
  });

  // Handle call initiation
  socket.on('initiate-call', (data) => {
    try {
      const { to, caller, type = 'video', offer = null, sessionId } = data;
      
      if (!to || !caller) {
        throw new Error('Caller and callee IDs are required');
      }

      const callerInfo = userSessions.get(caller) || { userData: {} };
      const callSessionId = sessionId || uuidv4();
      
      // Store the active call
      activeCalls.set(callSessionId, { 
        caller, 
        callee: to, 
        participants: [caller], 
        type,
        offer,
        startedAt: new Date(),
        status: 'initiated'
      });
      
      // Store the call in the user's session
      if (userSessions.has(caller)) {
        const userData = userSessions.get(caller);
        userSessions.set(caller, {
          ...userData,
          currentCall: callSessionId
        });
      }
      
      // Get callee's socket ID
      const calleeSession = userSessions.get(to);
      if (!calleeSession) {
        throw new Error('Callee is not connected');
      }
      
      // Notify the callee
      io.to(calleeSession.socketId).emit('incoming-call', { 
        sessionId: callSessionId, 
        caller, 
        type,
        offer,
        callerInfo: callerInfo.userData
      });
      
      console.log(`📞 Call initiated by ${caller} to ${to}, session: ${callSessionId}`);
      
      // Acknowledge to the caller
      socket.emit('call-initiated', { 
        sessionId: callSessionId, 
        callee: to 
      });
    } catch (error) {
      console.error('❌ Error initiating call:', error);
      socket.emit('error', { 
        message: 'Failed to initiate call',
        details: error.message 
      });
    }
  });

  // Handle call acceptance
  socket.on('accept-call', (data) => {
    try {
      const { to, answer = null, sessionId, callerId } = data;
      
      if (!to || !sessionId) {
        throw new Error('Recipient and session ID are required');
      }

      const call = activeCalls.get(sessionId);
      if (!call) {
        throw new Error('Call session not found');
      }

      // Update call status
      call.participants.push(callerId);
      call.status = 'in-progress';
      call.answer = answer;
      call.answeredAt = new Date();
      
      // Store the call in the user's session
      if (userSessions.has(callerId)) {
        const userData = userSessions.get(callerId);
        userSessions.set(callerId, {
          ...userData,
          currentCall: sessionId
        });
      }
      
      // Get caller's socket ID
      const callerSession = userSessions.get(to);
      if (!callerSession) {
        throw new Error('Caller is no longer connected');
      }
      
      // Notify the caller that the call was accepted
      io.to(callerSession.socketId).emit('call-accepted', { 
        sessionId, 
        answer,
        callerId
      });
      
      console.log(`✅ Call ${sessionId} accepted by ${callerId}`);
    } catch (error) {
      console.error('❌ Error accepting call:', error);
      socket.emit('error', { 
        message: 'Failed to accept call',
        details: error.message 
      });
    }
  });

  // Handle call rejection
  socket.on('reject-call', (data) => {
    try {
      const { to, sessionId, reason = 'Call rejected' } = data;
      
      if (!to || !sessionId) {
        throw new Error('Recipient and session ID are required');
      }

      const call = activeCalls.get(sessionId);
      if (!call) {
        console.warn(`⚠️ Call ${sessionId} not found during rejection`);
        return;
      }

      // Get the caller's socket ID
      const callerSession = userSessions.get(to);
      if (callerSession) {
        io.to(callerSession.socketId).emit('call-rejected', { 
          sessionId, 
          reason 
        });
      }
      
      // Clean up
      activeCalls.delete(sessionId);
      
      // Update user sessions
      [call.caller, call.callee].forEach(id => {
        if (userSessions.has(id)) {
          const userData = userSessions.get(id);
          if (userData.currentCall === sessionId) {
            userSessions.set(id, {
              ...userData,
              currentCall: null
            });
          }
        }
      });
      
      console.log(`❌ Call ${sessionId} rejected: ${reason}`);
    } catch (error) {
      console.error('❌ Error rejecting call:', error);
      socket.emit('error', { 
        message: 'Failed to reject call',
        details: error.message 
      });
    }
  });

  // Handle call end
  socket.on('end-call', (data) => {
    try {
      const { to, sessionId, reason = 'Call ended' } = data;
      
      if (!sessionId) {
        throw new Error('Session ID is required');
      }

      const userId = Array.from(userSessions.entries())
        .find(([id, session]) => session.socketId === socket.id)?.[0];
      
      endCall(sessionId, userId || to, reason);
      console.log(`📞 Call ${sessionId} ended by ${userId || to}: ${reason}`);
    } catch (error) {
      console.error('❌ Error ending call:', error);
      socket.emit('error', { 
        message: 'Failed to end call',
        details: error.message 
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    stats.connections--;
    console.log(`🔌 Client disconnected: ${socket.id} (${stats.connections} active, ${stats.totalConnections} total) - ${reason}`);
    
    // Find and clean up user session
    for (const [userId, data] of userSessions.entries()) {
      if (data.socketId === socket.id) {
        // End any active calls
        if (data.currentCall) {
          endCall(data.currentCall, userId, 'Participant disconnected');
        }
        
        // Leave any rooms
        if (data.currentRoom) {
          leaveRoom(socket, data.currentRoom, userId);
        }
        
        // Remove from sessions
        userSessions.delete(userId);
        console.log(`👤 User ${userId} session cleaned up`);
        break;
      }
    }
  });
});

// Server status monitoring
setInterval(() => {
  console.log(`📊 Server status: ${stats.connections} active connections, ${activeCalls.size} active calls, ${rooms.size} active rooms, ${userSessions.size} user sessions`);
}, 60000);

// Graceful shutdown
function gracefulShutdown() {
  console.log('🔄 Shutting down gracefully...');
  
  // Notify all connected clients
  io.emit('server-shutdown', { 
    message: 'Server is shutting down for maintenance',
    timestamp: new Date().toISOString() 
  });
  
  // Close all WebSocket connections
  io.close(() => {
    console.log('✅ All WebSocket connections closed');
  });
  
  // Close the HTTP server
  server.close(() => {
    console.log('✅ HTTP server closed');
    
    // Close MongoDB connection
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
  
  // Force close after timeout
  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  gracefulShutdown();
});

// Start the server
const PORT = process.env.PORT || 5002;
server.listen(PORT, '0.0.0.0', () => {
  const address = server.address();
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket URL: ws://localhost:${PORT}/socket.io/`);
  console.log(`📈 Server stats: ${Object.entries(stats).map(([k, v]) => `${k}=${v}`).join(', ')}`);
});

process.on('unhandledRejection', (err) => {
  console.error('⚠️ Unhandled Rejection:', err);
});