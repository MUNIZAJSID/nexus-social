import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Camera } from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { getMediaUrl } from '../api/client';

interface IncomingCallData {
  fromUser: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  isVideo: boolean;
  callId: string;
  conversationId?: string;
}

interface CallContextType {
  startCall: (targetUserId: string, targetUser: any, isVideo: boolean, conversationId?: string) => void;
  isCallActive: boolean;
}

const CallContext = createContext<CallContextType | null>(null);

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const [activeCall, setActiveCall] = useState<{
    targetUser: any;
    isVideo: boolean;
    callId: string;
    isCaller: boolean;
  } | null>(null);

  const [callStatus, setCallStatus] = useState<'calling' | 'connected' | 'ended'>('calling');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Limpeza de chamada
  const cleanupCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setActiveCall(null);
    setIncomingCall(null);
    setCallStatus('calling');
    setIsAudioMuted(false);
    setIsVideoMuted(false);
  };

  // Listeners de Socket.IO para chamadas
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data: IncomingCallData) => {
      setIncomingCall(data);
    };

    const handleCallAccepted = async (data: { callId: string; fromUserId: string }) => {
      setCallStatus('connected');
    };

    const handleCallRejected = () => {
      alert('Chamada recusada.');
      cleanupCall();
    };

    const handleCallEnded = () => {
      cleanupCall();
    };

    const handleWebRTCSignal = async (data: { fromUserId: string; signal: any; callId: string }) => {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      try {
        if (data.signal.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('webrtc_signal', {
            toUserId: data.fromUserId,
            signal: answer,
            callId: data.callId,
          });
        } else if (data.signal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
        } else if (data.signal.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(data.signal.candidate));
        }
      } catch (err) {
        console.error('Erro no sinal WebRTC:', err);
      }
    };

    socket.on('incoming_call', handleIncomingCall);
    socket.on('call_accepted', handleCallAccepted);
    socket.on('call_rejected', handleCallRejected);
    socket.on('call_ended', handleCallEnded);
    socket.on('webrtc_signal', handleWebRTCSignal);

    return () => {
      socket.off('incoming_call', handleIncomingCall);
      socket.off('call_accepted', handleCallAccepted);
      socket.off('call_rejected', handleCallRejected);
      socket.off('call_ended', handleCallEnded);
      socket.off('webrtc_signal', handleWebRTCSignal);
    };
  }, [socket]);

  // Iniciar uma chamada
  const startCall = async (
    targetUserId: string,
    targetUser: any,
    isVideo: boolean,
    conversationId?: string
  ) => {
    if (!socket || !user) return;
    const callId = `call_${Date.now()}`;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideo ? { facingMode: 'user', width: 640, height: 480 } : false,
        audio: true,
      });
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc_signal', {
            toUserId: targetUserId,
            signal: { candidate: event.candidate },
            callId,
          });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('call_user', {
        toUserId: targetUserId,
        isVideo,
        callId,
        conversationId,
      });

      socket.emit('webrtc_signal', {
        toUserId: targetUserId,
        signal: offer,
        callId,
      });

      setActiveCall({
        targetUser,
        isVideo,
        callId,
        isCaller: true,
      });
      setCallStatus('calling');

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Erro ao iniciar chamada:', err);
      alert('Não foi possível acessar a câmera ou microfone.');
      cleanupCall();
    }
  };

  // Aceitar chamada recebida
  const acceptCall = async () => {
    if (!socket || !incomingCall) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: incomingCall.isVideo ? { facingMode: 'user', width: 640, height: 480 } : false,
        audio: true,
      });
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc_signal', {
            toUserId: incomingCall.fromUser.id,
            signal: { candidate: event.candidate },
            callId: incomingCall.callId,
          });
        }
      };

      socket.emit('accept_call', {
        toUserId: incomingCall.fromUser.id,
        callId: incomingCall.callId,
      });

      setActiveCall({
        targetUser: incomingCall.fromUser,
        isVideo: incomingCall.isVideo,
        callId: incomingCall.callId,
        isCaller: false,
      });
      setCallStatus('connected');
      setIncomingCall(null);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Erro ao aceitar chamada:', err);
      alert('Não foi possível acessar a câmera ou microfone.');
      rejectCall();
    }
  };

  // Recusar chamada recebida
  const rejectCall = () => {
    if (!socket || !incomingCall) return;
    socket.emit('reject_call', {
      toUserId: incomingCall.fromUser.id,
      callId: incomingCall.callId,
    });
    setIncomingCall(null);
  };

  // Encerrar chamada ativa
  const endCall = () => {
    if (socket && activeCall) {
      socket.emit('end_call', {
        toUserId: activeCall.targetUser.id,
        callId: activeCall.callId,
      });
    }
    cleanupCall();
  };

  const toggleMuteAudio = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((t) => (t.enabled = !t.enabled));
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const toggleMuteVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((t) => (t.enabled = !t.enabled));
      setIsVideoMuted(!isVideoMuted);
    }
  };

  return (
    <CallContext.Provider value={{ startCall, isCallActive: Boolean(activeCall) }}>
      {children}

      {/* DIÁLOGO DE CHAMADA RECEBIDA (RINGTONE/MODAL) */}
      {incomingCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in select-none">
          <div className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col items-center gap-4 text-center shadow-2xl animate-bounce-subtle">
            <div className="relative">
              <Avatar
                src={incomingCall.fromUser.avatarUrl}
                name={incomingCall.fromUser.displayName}
                size="xl"
                className="ring-4 ring-brand-500 animate-pulse"
              />
              <div className="absolute -bottom-1 -right-1 p-2 rounded-full bg-brand-500 text-white shadow-md">
                {incomingCall.isVideo ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-white">
                {incomingCall.fromUser.displayName}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Chamada de {incomingCall.isVideo ? 'vídeo' : 'voz'} recebida...
              </p>
            </div>

            <div className="flex items-center gap-4 w-full pt-2">
              <button
                type="button"
                onClick={rejectCall}
                className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/30 active:scale-95 transition-all cursor-pointer"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Recusar</span>
              </button>

              <button
                type="button"
                onClick={acceptCall}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer animate-pulse"
              >
                <Phone className="w-4 h-4" />
                <span>Atender</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TELA DE CHAMADA ATIVA */}
      {activeCall && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between select-none animate-in zoom-in-95 duration-200">
          {/* Top Bar com Info do Contato */}
          <div className="relative z-20 p-4 pt-6 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-3">
              <Avatar
                src={activeCall.targetUser.avatarUrl}
                name={activeCall.targetUser.displayName}
                size="md"
              />
              <div>
                <h3 className="text-sm font-bold text-white">
                  {activeCall.targetUser.displayName}
                </h3>
                <span className="text-[11px] font-semibold text-emerald-400">
                  {callStatus === 'calling' ? 'Chamando...' : 'Conectado'}
                </span>
              </div>
            </div>
          </div>

          {/* Área Central dos Vídeos */}
          <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden bg-black">
            {/* Vídeo Remoto (Tela Cheia) */}
            {activeCall.isVideo ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-4">
                <Avatar
                  src={activeCall.targetUser.avatarUrl}
                  name={activeCall.targetUser.displayName}
                  size="xl"
                  className="w-28 h-28 ring-4 ring-brand-500 animate-pulse"
                />
                <h2 className="text-lg font-bold text-white">
                  {activeCall.targetUser.displayName}
                </h2>
              </div>
            )}

            {/* Vídeo Local Miniatura (PIP) */}
            {activeCall.isVideo && (
              <div className="absolute top-20 right-4 w-28 h-40 sm:w-36 sm:h-48 rounded-2xl overflow-hidden bg-slate-900 border-2 border-white/20 shadow-2xl z-20">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`w-full h-full object-cover ${isVideoMuted ? 'hidden' : ''}`}
                />
                {isVideoMuted && (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-bold">
                    Câmera desligada
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Barra de Controles Inferior */}
          <div className="relative z-20 p-6 flex items-center justify-center gap-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
            {/* Mudo Microfone */}
            <button
              type="button"
              onClick={toggleMuteAudio}
              className={`p-4 rounded-full transition-all shadow-lg active:scale-95 cursor-pointer ${
                isAudioMuted ? 'bg-slate-700 text-rose-400' : 'bg-slate-800 text-white hover:bg-slate-700'
              }`}
              title={isAudioMuted ? 'Ativar microfone' : 'Mutar microfone'}
            >
              {isAudioMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            {/* Mudo Câmera (se for chamada de vídeo) */}
            {activeCall.isVideo && (
              <button
                type="button"
                onClick={toggleMuteVideo}
                className={`p-4 rounded-full transition-all shadow-lg active:scale-95 cursor-pointer ${
                  isVideoMuted ? 'bg-slate-700 text-rose-400' : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
                title={isVideoMuted ? 'Ligar câmera' : 'Desligar câmera'}
              >
                {isVideoMuted ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
              </button>
            )}

            {/* Desligar Chamada */}
            <button
              type="button"
              onClick={endCall}
              className="p-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-600/40 active:scale-95 transition-all cursor-pointer"
              title="Desligar"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error('useCall deve ser usado dentro de um CallProvider');
  return context;
};
