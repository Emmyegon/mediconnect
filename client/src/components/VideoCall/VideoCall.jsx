import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';
import { 
  XMarkIcon, 
  VideoCameraIcon, 
  VideoCameraSlashIcon, 
  SpeakerWaveIcon, 
  SpeakerXMarkIcon,
  PhoneArrowUpRightIcon,
  PhoneXMarkIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  SignalIcon,
  WifiIcon
} from '@heroicons/react/24/outline';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

// Constants
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' }
];

const CALL_STATUS = {
  IDLE: 'idle',
  CALLING: 'calling',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  REJECTED: 'rejected',
  ENDED: 'ended',
  ERROR: 'error'
};

class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error('Component error:', error, errorInfo); }
  render() { return this.state.hasError ? <div className="p-2 text-red-500">Something went wrong. Please refresh the page.</div> : this.props.children; }
}

const VideoCall = ({ onEndCall, userId, targetUserId }) => {
  const { sessionId: urlSessionId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useSelector((state) => state.auth);
  
  // State
  const [callStatus, setCallStatus] = useState(CALL_STATUS.IDLE);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [notes, setNotes] = useState([]);
  const [noteContent, setNoteContent] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [callStartTime, setCallStartTime] = useState(null);
  const [otherParticipantId, setOtherParticipantId] = useState(targetUserId || null);
  const [sessionId] = useState(urlSessionId || `call_${Date.now()}`);
  const [callerInfo, setCallerInfo] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [isInitialized, setIsInitialized] = useState(false);
  const [mediaError, setMediaError] = useState(null);
  const [debugLogs, setDebugLogs] = useState([]);
  const [showDebug, setShowDebug] = useState(true);
  const [connectionRetries, setConnectionRetries] = useState(0);

  // Refs
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const socketRef = useRef();
  const peerRef = useRef();
  const callDurationRef = useRef();
  const connectionTimeoutRef = useRef();

  // Editor setup - ADDED THIS
  const editor = useEditor({
    extensions: [StarterKit],
    content: noteContent,
    onUpdate: ({ editor }) => setNoteContent(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none h-full',
      },
    },
  });

  // Debug logging
  const addDebugLog = useCallback((message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const log = `[${timestamp}] ${message}`;
    console.log(`🔍 ${log}`);
    setDebugLogs(prev => [...prev.slice(-50), { message, type, timestamp }]);
  }, []);

  // Helper Functions
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const addTimestamp = useCallback(() => {
    if (editor) {
      editor.commands.insertContent(`[${formatTime(callDuration)}] `);
    }
  }, [editor, callDuration]);

  // Socket and Peer Connection Management
  const initializeSocket = useCallback(() => {
    // Clean up existing socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const wsUrl = process.env.REACT_APP_WS_URL || 'http://localhost:5002';
    addDebugLog(`🔌 Connecting to WebSocket: ${wsUrl}`);
    
    try {
      const socket = io(wsUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      // Socket event handlers
      socket.on('connect', () => {
        addDebugLog(`✅ Socket CONNECTED with ID: ${socket.id}`, 'success');
        setConnectionStatus('Connected');
        setConnectionRetries(0);
        
        const userData = {
          userId: user?._id || userId,
          userData: { 
            name: user?.name || 'User', 
            role: user?.role || 'user',
            socketId: socket.id 
          }
        };
        
        addDebugLog(`👤 Registering user: ${userData.userId}`);
        socket.emit('register-user', userData);
        
        addDebugLog(`🏠 Joining room: ${sessionId}`);
        socket.emit('join-room', { 
          ...userData, 
          room: sessionId 
        });
      });

      socket.on('disconnect', (reason) => {
        addDebugLog(`🔌 Socket DISCONNECTED: ${reason}`, 'warning');
        setConnectionStatus('Disconnected');
      });

      socket.on('connect_error', (error) => {
        addDebugLog(`❌ Socket CONNECTION ERROR: ${error.message}`, 'error');
        setConnectionStatus('Connection Failed');
        
        // Auto-retry connection
        if (connectionRetries < 3) {
          const retryDelay = Math.pow(2, connectionRetries) * 1000; // Exponential backoff
          addDebugLog(`🔄 Retrying connection in ${retryDelay/1000}s... (Attempt ${connectionRetries + 1})`);
          setConnectionRetries(prev => prev + 1);
          
          connectionTimeoutRef.current = setTimeout(() => {
            initializeSocket();
          }, retryDelay);
        }
      });

      socket.on('user-registered', (data) => {
        addDebugLog(`✅ User registered successfully: ${data.userId}`, 'success');
      });

      socket.on('room-joined', (data) => {
        addDebugLog(`✅ Room joined: ${data.room}`, 'success');
      });

      socket.on('user-joined', (data) => {
        addDebugLog(`👤 User JOINED room: ${data.userId}`, 'success');
        setOtherParticipantId(data.userId);
        
        if (targetUserId && data.userId === targetUserId && callStatus === CALL_STATUS.IDLE) {
          addDebugLog(`🎯 Target user detected - auto-starting call`);
          setTimeout(() => startCall(targetUserId, true), 1000);
        }
      });

      socket.on('user-left', (data) => {
        addDebugLog(`👤 User LEFT: ${data.userId}`, 'warning');
      });

      socket.on('offer', async (data) => {
        addDebugLog(`📨 Received OFFER from: ${data.caller}`, 'success');
        
        if (peerRef.current) {
          addDebugLog('⚠️ Peer already exists, ignoring offer', 'warning');
          return;
        }

        setCallerInfo({
          id: data.caller,
          name: data.callerInfo?.name || 'Unknown User',
          type: data.type
        });
        setCallStatus(CALL_STATUS.CONNECTING);

        try {
          const stream = await getUserMedia(data.type === 'video');
          addDebugLog('Creating peer connection as ANSWERER');
          
          const peer = new Peer({
            initiator: false,
            stream: stream,
            trickle: true,
            config: { iceServers: ICE_SERVERS }
          });

          setupPeerHandlers(peer, data.caller, socket);
          peer.signal(data.offer);
          peerRef.current = peer;
          
        } catch (error) {
          addDebugLog(`❌ Error handling offer: ${error.message}`, 'error');
          setCallStatus(CALL_STATUS.ERROR);
        }
      });

      socket.on('answer', (data) => {
        addDebugLog(`📨 Received ANSWER from: ${data.to}`, 'success');
        if (peerRef.current && !peerRef.current.destroyed) {
          peerRef.current.signal(data.answer);
        } else {
          addDebugLog('⚠️ No active peer connection for answer', 'warning');
        }
      });

      socket.on('ice-candidate', (data) => {
        addDebugLog(`🧊 Received ICE candidate`, 'info');
        if (peerRef.current && data.candidate) {
          peerRef.current.signal(data.candidate);
        }
      });

      socket.on('call-rejected', (data) => {
        addDebugLog(`❌ Call REJECTED: ${data.reason}`, 'warning');
        setCallStatus(CALL_STATUS.REJECTED);
        cleanupMediaStreams();
      });

      socket.on('call-ended', (data) => {
        addDebugLog(`📞 Call ENDED: ${data.reason}`, 'warning');
        setCallStatus(CALL_STATUS.ENDED);
        cleanupMediaStreams();
      });

      socket.on('error', (error) => {
        addDebugLog(`💥 Socket ERROR: ${error.message}`, 'error');
      });

      socketRef.current = socket;
      return socket;

    } catch (error) {
      addDebugLog(`💥 Failed to initialize socket: ${error.message}`, 'error');
      return null;
    }
  }, [sessionId, user, userId, targetUserId, callStatus, connectionRetries]);

  const setupPeerHandlers = (peer, targetUserId, socket) => {
    peer.on('signal', (data) => {
      addDebugLog(`📡 Peer SIGNAL: ${data.type}`, 'info');
      
      if (data.type === 'offer') {
        socket.emit('offer', {
          to: targetUserId,
          offer: data,
          sessionId,
          caller: user?._id || userId,
          callerInfo: { name: user?.name || 'User', role: user?.role || 'user' },
          type: 'video'
        });
      } else if (data.type === 'answer') {
        socket.emit('answer', {
          to: targetUserId,
          answer: data,
          sessionId
        });
      } else if (data.type === 'candidate') {
        socket.emit('ice-candidate', {
          to: targetUserId,
          candidate: data,
          sessionId
        });
      }
    });

    peer.on('stream', (remoteStream) => {
      addDebugLog('🎥 Received REMOTE STREAM - Connection established!', 'success');
      setRemoteStream(remoteStream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      setCallStatus(CALL_STATUS.CONNECTED);
      setCallStartTime(Date.now());
    });

    peer.on('connect', () => {
      addDebugLog('✅ Peer CONNECTION established', 'success');
    });

    peer.on('error', (err) => {
      addDebugLog(`❌ Peer ERROR: ${err.message}`, 'error');
      setCallStatus(CALL_STATUS.ERROR);
    });

    peer.on('close', () => {
      addDebugLog('🔌 Peer connection closed', 'warning');
      setCallStatus(CALL_STATUS.ENDED);
      cleanupMediaStreams();
    });
  };

  const cleanupSocket = useCallback(() => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
    }
    if (socketRef.current) {
      addDebugLog('🧹 Cleaning up socket connection');
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  // Media Stream Management
  const getUserMedia = async (isVideo = true) => {
    try {
      addDebugLog(`🎥 Requesting media access: video=${isVideo}`);
      
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }

      const constraints = {
        audio: true,
        video: isVideo ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      setMediaError(null);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      addDebugLog(`✅ Media access granted`, 'success');
      return stream;
    } catch (error) {
      addDebugLog(`❌ Media access failed: ${error.message}`, 'error');
      setMediaError(error.message);
      throw error;
    }
  };

  const cleanupMediaStreams = useCallback(() => {
    addDebugLog('🧹 Cleaning up media streams');
    [localStream, remoteStream].forEach(stream => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    });
    setLocalStream(null);
    setRemoteStream(null);
  }, [localStream, remoteStream]);

  // Call Controls
  const startCall = useCallback(async (targetUserId = targetUserId, isVideo = true) => {
    try {
      if (!targetUserId) {
        addDebugLog('❌ No target user specified', 'error');
        return;
      }

      addDebugLog(`📞 Starting call to: ${targetUserId}`);
      setCallStatus(CALL_STATUS.CALLING);
      setOtherParticipantId(targetUserId);
      
      const socket = initializeSocket();
      if (!socket || !socket.connected) {
        addDebugLog('❌ Socket not connected, cannot start call', 'error');
        return;
      }

      const stream = await getUserMedia(isVideo);
      
      // Wait for socket to be ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addDebugLog('Creating peer connection as INITIATOR');
      const peer = new Peer({
        initiator: true,
        stream: stream,
        trickle: true,
        config: { iceServers: ICE_SERVERS }
      });

      setupPeerHandlers(peer, targetUserId, socket);
      peerRef.current = peer;
      
    } catch (error) {
      addDebugLog(`❌ Error starting call: ${error.message}`, 'error');
      setCallStatus(CALL_STATUS.ERROR);
    }
  }, [initializeSocket, sessionId, user, userId, targetUserId, cleanupMediaStreams]);

  const answerCall = async () => {
    try {
      if (!callerInfo) {
        addDebugLog('❌ No caller info available', 'error');
        return;
      }

      addDebugLog(`📞 Answering call from: ${callerInfo.id}`);
      const stream = await getUserMedia(callerInfo.type === 'video');
      
      const peer = new Peer({
        initiator: false,
        stream: stream,
        trickle: true,
        config: { iceServers: ICE_SERVERS }
      });

      setupPeerHandlers(peer, callerInfo.id, socketRef.current);
      peerRef.current = peer;
      
    } catch (error) {
      addDebugLog(`❌ Error answering call: ${error.message}`, 'error');
      setCallStatus(CALL_STATUS.ERROR);
    }
  };

  const rejectCall = () => {
    if (socketRef.current && callerInfo) {
      socketRef.current.emit('reject-call', {
        to: callerInfo.id,
        sessionId,
        reason: 'Call rejected by user'
      });
      addDebugLog('Call rejected');
    }
    setCallStatus(CALL_STATUS.REJECTED);
    cleanupMediaStreams();
  };

  const endCall = useCallback(() => {
    addDebugLog('📞 Ending call');
    
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.emit('end-call', { 
        to: otherParticipantId || callerInfo?.id,
        sessionId,
        reason: 'Call ended by user'
      });
    }
    
    setCallStatus(CALL_STATUS.ENDED);
    cleanupMediaStreams();
    onEndCall?.();
  }, [sessionId, otherParticipantId, callerInfo?.id, onEndCall, cleanupMediaStreams]);

  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
      addDebugLog(`Audio ${!isMuted ? 'muted' : 'unmuted'}`);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
      addDebugLog(`Video ${!isVideoOff ? 'disabled' : 'enabled'}`);
    }
  };

  const manualReconnect = () => {
    addDebugLog('🔄 Manual reconnect requested');
    setConnectionRetries(0);
    initializeSocket();
  };

  // Initialize
  useEffect(() => {
    const initialize = async () => {
      try {
        addDebugLog('🚀 Initializing VideoCall component');
        initializeSocket();
        
        try {
          await getUserMedia(true);
        } catch (error) {
          addDebugLog('⚠️ Media initialization failed, continuing without local stream', 'warning');
        }
        
        setIsInitialized(true);
        addDebugLog('✅ VideoCall component initialized', 'success');
      } catch (error) {
        addDebugLog(`❌ Initialization error: ${error.message}`, 'error');
      }
    };

    initialize();

    return () => {
      cleanupSocket();
      cleanupMediaStreams();
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      clearInterval(callDurationRef.current);
    };
  }, [initializeSocket, cleanupSocket, cleanupMediaStreams]);

  // Auto-start call if targetUserId is provided
  useEffect(() => {
    if (targetUserId && isInitialized && callStatus === CALL_STATUS.IDLE) {
      addDebugLog(`🎯 Auto-starting call to target user: ${targetUserId}`);
      const timer = setTimeout(() => {
        startCall(targetUserId, true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [targetUserId, isInitialized, callStatus, startCall]);

  // Call duration timer
  useEffect(() => {
    if (callStatus === CALL_STATUS.CONNECTED && callStartTime) {
      callDurationRef.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime) / 1000));
      }, 1000);
    } else {
      clearInterval(callDurationRef.current);
    }
    return () => clearInterval(callDurationRef.current);
  }, [callStatus, callStartTime]);

  // Debug panel component
  const DebugPanel = () => (
    <div className="absolute top-20 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg z-50 max-w-md max-h-96 overflow-auto">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold flex items-center">
          <SignalIcon className="h-4 w-4 mr-2" />
          Connection Debug
        </h3>
        <div className="flex space-x-2">
          <button 
            onClick={manualReconnect}
            className="text-sm bg-blue-600 px-2 py-1 rounded hover:bg-blue-700"
          >
            Reconnect
          </button>
          <button 
            onClick={() => setShowDebug(!showDebug)}
            className="text-sm bg-gray-700 px-2 py-1 rounded hover:bg-gray-600"
          >
            {showDebug ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>
      {showDebug && (
        <>
          <div className="text-xs space-y-1 mb-2 p-2 bg-gray-800 rounded">
            <div className="flex items-center">
              <WifiIcon className={`h-3 w-3 mr-2 ${connectionStatus === 'Connected' ? 'text-green-400' : 'text-red-400'}`} />
              Socket: {connectionStatus} {socketRef.current?.id && `(${socketRef.current.id})`}
            </div>
            <div>Room: {sessionId}</div>
            <div>Target User: {targetUserId || 'None'}</div>
            <div>Other User: {otherParticipantId || 'None'}</div>
            <div>Status: <span className="font-semibold">{callStatus}</span></div>
            <div>Retries: {connectionRetries}</div>
          </div>
          <div className="border-t border-gray-600 pt-2">
            <div className="text-xs font-mono space-y-1 max-h-32 overflow-y-auto">
              {debugLogs.slice(-8).map((log, index) => (
                <div 
                  key={index} 
                  className={`${
                    log.type === 'error' ? 'text-red-400' :
                    log.type === 'warning' ? 'text-yellow-400' :
                    log.type === 'success' ? 'text-green-400' : 'text-gray-300'
                  }`}
                >
                  {log.message}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  // Render connection error state
  const renderConnectionError = () => {
    if (connectionStatus === 'Connected') return null;

    return (
      <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-40">
        <div className="text-center text-white p-8 max-w-md">
          <WifiIcon className="h-16 w-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold mb-2">Connection Failed</h2>
          <p className="text-gray-300 mb-4">
            Unable to connect to the server. Please check:
          </p>
          <ul className="text-left text-gray-300 mb-6 space-y-2">
            <li>• Server is running on port 5002</li>
            <li>• Network connectivity</li>
            <li>• Firewall settings</li>
          </ul>
          <div className="space-y-3">
            <button
              onClick={manualReconnect}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-full text-white"
            >
              Retry Connection
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-full text-white block mx-auto"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Rest of the render function
  const renderVideoArea = () => {
    if (!targetUserId && callStatus === CALL_STATUS.IDLE) {
      return (
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          <div className="text-center text-white">
            <UserGroupIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-semibold mb-2">Ready for Call</h2>
            <p className="text-gray-400 mb-6">
              {connectionStatus === 'Connected' 
                ? 'Waiting for incoming call or start a new call' 
                : 'Connecting to server...'}
            </p>
            <div className="space-y-4">
              <button
                onClick={() => navigate('/call/start')}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-full text-white flex items-center mx-auto"
                disabled={connectionStatus !== 'Connected'}
              >
                <PhoneArrowUpRightIcon className="h-5 w-5 mr-2" />
                Start New Call
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-full text-white"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="absolute inset-0 bg-black">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              <div className="text-center text-white">
                <div className="text-xl mb-2">Waiting for connection...</div>
                <div className="text-gray-400">Status: {callStatus}</div>
                {connectionStatus !== 'Connected' && (
                  <div className="text-yellow-400 mt-2">Trying to connect to server...</div>
                )}
              </div>
            </div>
          )}
        </div>

        {localStream && (
          <div className="absolute bottom-4 right-4 w-48 h-36 bg-black rounded-lg overflow-hidden shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </>
    );
  };

  const renderCallStatus = () => {
    switch (callStatus) {
      case CALL_STATUS.CALLING:
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 text-white z-50">
            <div className="text-center">
              <div className="animate-pulse text-2xl mb-4">Calling {otherParticipantId}...</div>
              <button
                onClick={endCall}
                className="px-6 py-2 bg-red-500 rounded-full text-white flex items-center mx-auto"
              >
                <PhoneXMarkIcon className="h-5 w-5 mr-2" />
                Cancel Call
              </button>
            </div>
          </div>
        );
      case CALL_STATUS.CONNECTING:
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 text-white z-50">
            <div className="text-center">
              <div className="text-2xl mb-4">Incoming Call</div>
              <div className="text-xl mb-6">{callerInfo?.name || 'Unknown User'}</div>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={answerCall}
                  className="px-6 py-2 bg-green-500 rounded-full text-white flex items-center"
                >
                  <PhoneArrowUpRightIcon className="h-5 w-5 mr-2" />
                  Answer
                </button>
                <button
                  onClick={rejectCall}
                  className="px-6 py-2 bg-red-500 rounded-full text-white flex items-center"
                >
                  <PhoneXMarkIcon className="h-5 w-5 mr-2" />
                  Reject
                </button>
              </div>
            </div>
          </div>
        );
      case CALL_STATUS.REJECTED:
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 text-white z-50">
            <div className="text-center">
              <div className="text-2xl mb-4">Call Rejected</div>
              <button
                onClick={() => setCallStatus(CALL_STATUS.ENDED)}
                className="px-6 py-2 bg-blue-500 rounded-full text-white"
              >
                OK
              </button>
            </div>
          </div>
        );
      case CALL_STATUS.ENDED:
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 text-white z-50">
            <div className="text-center">
              <div className="text-2xl mb-4">Call Ended</div>
              <div className="mb-6">Duration: {formatTime(callDuration)}</div>
              <button
                onClick={() => {
                  setCallStatus(CALL_STATUS.IDLE);
                  onEndCall?.();
                }}
                className="px-6 py-2 bg-blue-500 rounded-full text-white"
              >
                Close
              </button>
            </div>
          </div>
        );
      case CALL_STATUS.ERROR:
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 text-white z-50">
            <div className="text-center">
              <div className="text-2xl mb-4 text-red-500">Connection Error</div>
              <button
                onClick={() => {
                  setCallStatus(CALL_STATUS.IDLE);
                  cleanupMediaStreams();
                }}
                className="px-6 py-2 bg-red-500 rounded-full text-white"
              >
                Close
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <DebugPanel />
      {renderConnectionError()}
      
      <div className="flex-1 relative">
        {renderVideoArea()}
        {renderCallStatus()}

        {(callStatus === CALL_STATUS.CONNECTED || callStatus === CALL_STATUS.CONNECTING) && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 flex justify-center space-x-4">
            <button
              onClick={toggleMute}
              className={`p-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'} transition-colors`}
            >
              {isMuted ? <SpeakerXMarkIcon className="h-6 w-6" /> : <SpeakerWaveIcon className="h-6 w-6" />}
            </button>
            
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'} transition-colors`}
            >
              {isVideoOff ? <VideoCameraSlashIcon className="h-6 w-6" /> : <VideoCameraIcon className="h-6 w-6" />}
            </button>
            
            <button
              onClick={endCall}
              className="p-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        )}

        {callStatus === CALL_STATUS.CONNECTED && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full">
            {formatTime(callDuration)}
          </div>
        )}
      </div>

      <div className="h-1/3 bg-gray-800 border-t border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h3 className="font-medium">Call Notes</h3>
        </div>
        <ErrorBoundary>
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              {editor ? (
                <EditorContent 
                  editor={editor} 
                  className="h-full bg-gray-800 text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              ) : (
                <div className="text-gray-400">Loading editor...</div>
              )}
            </div>
            <div className="p-2 border-t border-gray-700 flex justify-between items-center">
              <button
                onClick={addTimestamp}
                className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded"
                disabled={!editor}
              >
                Add Timestamp
              </button>
              <button
                onClick={() => {
                  if (noteContent.trim()) {
                    setNotes(prev => [...prev, { content: noteContent, timestamp: new Date(), callDuration }]);
                    setNoteContent('');
                    editor?.commands.clearContent();
                  }
                }}
                disabled={!noteContent.trim()}
                className={`px-3 py-1 text-sm rounded ${
                  noteContent.trim() ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 cursor-not-allowed'
                }`}
              >
                Save Note
              </button>
            </div>
          </div>
        </ErrorBoundary>
      </div>
    </div>
  );
};

VideoCall.propTypes = {
  onEndCall: PropTypes.func.isRequired,
  userId: PropTypes.string.isRequired,
  targetUserId: PropTypes.string,
};

export default VideoCall;