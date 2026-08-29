import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Send, Trash2 } from 'lucide-react';

interface VoiceRecorderProps {
  onSendVoice: (audioFile: File) => void;
  disabled?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onSendVoice,
  disabled,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Erro ao acessar microfone:', err);
      alert('Não foi possível acessar o microfone. Verifique as permissões do seu navegador.');
    }
  };

  const cancelRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const stopAndSend = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const audioFile = new File([audioBlob], `voice-message-${Date.now()}.webm`, {
        type: 'audio/webm',
      });
      onSendVoice(audioFile);
      setIsRecording(false);
      setRecordingSeconds(0);
    };

    mediaRecorderRef.current.stop();
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isRecording) {
    return (
      <div className="flex items-center gap-3 flex-1 bg-rose-500/10 border border-rose-500/30 rounded-2xl px-4 py-2 animate-in fade-in duration-150">
        <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
        <span className="text-xs font-bold text-rose-500">
          Gravando áudio: {formatSeconds(recordingSeconds)}
        </span>

        <div className="flex-1 flex items-center justify-center gap-1 opacity-70">
          <span className="w-1 h-3 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1 h-5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1 h-4 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          <span className="w-1 h-6 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
          <span className="w-1 h-3 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '250ms' }} />
        </div>

        {/* Botão Cancelar */}
        <button
          type="button"
          onClick={cancelRecording}
          className="p-1.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
          title="Cancelar gravação"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Botão Enviar Áudio */}
        <button
          type="button"
          onClick={stopAndSend}
          className="p-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md active:scale-95 transition-transform"
          title="Enviar áudio"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startRecording}
      disabled={disabled}
      title="Gravar mensagem de voz"
      className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all cursor-pointer disabled:opacity-50 flex-shrink-0"
    >
      <Mic className="w-5 h-5" />
    </button>
  );
};
