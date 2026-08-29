import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  RotateCcw,
  X,
  Check,
  Zap,
  ZapOff,
  SwitchCamera,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (file: File) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onPhotoCaptured,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Iniciar câmera
  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    setError(null);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }

      // Verifica se há mais de uma câmera
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setHasMultipleCameras(videoInputs.length > 1);
    } catch (err: any) {
      console.error('Erro ao acessar a câmera:', err);
      if (err.name === 'NotAllowedError') {
        setError('Permissão de câmera negada. Permita o acesso nas configurações do seu navegador.');
      } else if (err.name === 'NotFoundError') {
        setError('Nenhuma câmera encontrada neste dispositivo.');
      } else {
        setError('Não foi possível iniciar a câmera. Tente novamente.');
      }
    }
  }, [stream]);

  useEffect(() => {
    if (isOpen) {
      setCapturedDataUrl(null);
      startCamera(facingMode);
    } else {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  // Alternar entre câmera frontal e traseira
  const handleToggleCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capturar foto do vídeo
  const handleCapture = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Efeito de flash na tela
    if (flashEnabled) {
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 200);
    }

    // Se for câmera frontal, espelha a imagem para ficar natural
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedDataUrl(dataUrl);

    // Para o stream de vídeo enquanto revisa
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Confirmar e usar foto capturada
  const handleConfirmPhoto = () => {
    if (!capturedDataUrl) return;

    // Converte DataURL para File
    const byteString = atob(capturedDataUrl.split(',')[1]);
    const mimeString = capturedDataUrl.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([ab], { type: mimeString });
    const file = new File([blob], `nexus_camera_${Date.now()}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });

    onPhotoCaptured(file);
    onClose();
  };

  // Tirar outra foto
  const handleRetake = () => {
    setCapturedDataUrl(null);
    startCamera(facingMode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-200 select-none">
      {/* Flash branco animado */}
      {isFlashing && (
        <div className="fixed inset-0 z-50 bg-white pointer-events-none transition-opacity duration-150" />
      )}

      <div className="relative w-full max-w-lg h-full sm:h-[90vh] bg-slate-950 sm:rounded-3xl overflow-hidden flex flex-col justify-between shadow-2xl">
        {/* Header da Câmera */}
        <header className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFlashEnabled(!flashEnabled)}
              className={`p-2.5 rounded-full backdrop-blur-md border transition-all cursor-pointer ${
                flashEnabled
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                  : 'bg-black/40 border-white/10 text-white/70 hover:text-white'
              }`}
              title={flashEnabled ? 'Flash Ativado' : 'Flash Desativado'}
            >
              {flashEnabled ? <Zap className="w-5 h-5 fill-amber-400 text-amber-400" /> : <ZapOff className="w-5 h-5" />}
            </button>
          </div>

          <span className="text-white text-xs font-bold tracking-wider uppercase opacity-80">
            {capturedDataUrl ? 'Revisar Foto' : 'Câmera Nexus'}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-full bg-black/40 hover:bg-black/70 border border-white/10 text-white transition-colors cursor-pointer"
            title="Fechar Câmera"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Viewfinder da Câmera / Preview da Foto */}
        <div className="relative flex-1 w-full h-full flex items-center justify-center bg-black overflow-hidden">
          {error ? (
            <div className="p-6 text-center max-w-xs flex flex-col items-center gap-3">
              <AlertCircle className="w-12 h-12 text-rose-500" />
              <p className="text-sm font-semibold text-white">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => startCamera(facingMode)}
                className="mt-2 text-xs"
              >
                Tentar Novamente
              </Button>
            </div>
          ) : capturedDataUrl ? (
            <img
              src={capturedDataUrl}
              alt="Foto Capturada"
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${
                facingMode === 'user' ? 'scale-x-[-1]' : ''
              }`}
            />
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Rodapé de Controles (Disparador, Troca de Câmera, Confirmar) */}
        <footer className="absolute bottom-0 inset-x-0 z-20 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-around">
          {capturedDataUrl ? (
            /* Modo de Revisão: Tirar Outra ou Usar Foto */
            <div className="flex items-center justify-between w-full max-w-xs mx-auto gap-4">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-semibold text-xs transition-all cursor-pointer active:scale-95 border border-white/10"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Tirar Outra</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmPhoto}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Usar Foto</span>
              </button>
            </div>
          ) : (
            /* Modo de Captura: Botão de Trocar Câmera e Botão do Obturador */
            <div className="flex items-center justify-between w-full max-w-xs mx-auto">
              <div className="w-12 h-12 flex items-center justify-center">
                {hasMultipleCameras && (
                  <button
                    type="button"
                    onClick={handleToggleCamera}
                    className="p-3 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md text-white border border-white/10 transition-transform active:rotate-180 duration-300 cursor-pointer"
                    title="Virar Câmera"
                  >
                    <SwitchCamera className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Botão de Disparo Estilo iPhone / Instagram */}
              <button
                type="button"
                onClick={handleCapture}
                className="relative w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1.5 transition-transform active:scale-90 hover:scale-105 cursor-pointer shadow-2xl"
                title="Tirar Foto"
              >
                <div className="w-full h-full rounded-full bg-white transition-all hover:bg-slate-100" />
              </button>

              <div className="w-12 h-12" />
            </div>
          )}
        </footer>
      </div>
    </div>
  );
};
