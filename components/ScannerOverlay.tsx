
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, RefreshCw, Zap, AlertTriangle } from 'lucide-react';
import { Button } from './SharedComponents';

interface ScannerOverlayProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
  title?: string;
  formats?: Html5QrcodeSupportedFormats[];
}

export const ScannerOverlay: React.FC<ScannerOverlayProps> = ({ 
  onScan, 
  onClose, 
  title = "Scan Barcode or QR Code",
  formats = [
    Html5QrcodeSupportedFormats.QR_CODE,
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8
  ]
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const elementId = "reader";

  useEffect(() => {
    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode(elementId);
        scannerRef.current = html5QrCode;

        const config = { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        };

        await html5QrCode.start(
          { facingMode: "environment" }, 
          config, 
          (decodedText) => {
            onScan(decodedText);
            cleanup();
            onClose();
          },
          () => {} // Ignore scan errors (polling)
        );
        setIsInitializing(false);
      } catch (err: any) {
        console.error("Scanner Error:", err);
        setError("Failed to access camera. Please ensure camera permissions are granted.");
        setIsInitializing(false);
      }
    };

    startScanner();

    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().catch(e => console.warn("Stop error", e));
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-slate-900 text-white">
        <div className="flex items-center gap-3">
          <Camera className="w-5 h-5 text-gov-500" />
          <h3 className="font-bold text-sm">{title}</h3>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Viewfinder */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        <div id={elementId} className="w-full h-full max-w-md bg-black"></div>
        
        {isInitializing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10">
            <RefreshCw className="w-10 h-10 text-gov-500 animate-spin mb-4" />
            <p className="text-white text-sm font-medium">Initializing Camera...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 p-8 text-center z-20">
            <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-white font-bold mb-4">{error}</p>
            <Button onClick={onClose} variant="outline" className="text-white border-white hover:bg-white/10">
              Close Scanner
            </Button>
          </div>
        )}

        {/* Viewfinder HUD */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-64 h-64 border-2 border-white/30 rounded-2xl relative">
             <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-gov-500 rounded-tl-xl"></div>
             <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-gov-500 rounded-tr-xl"></div>
             <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-gov-500 rounded-bl-xl"></div>
             <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-gov-500 rounded-br-xl"></div>
             
             {/* Animated scan line */}
             {!isInitializing && !error && (
                <div className="absolute left-0 right-0 h-0.5 bg-gov-500/50 shadow-[0_0_15px_rgba(14,165,233,0.5)] animate-scan-line"></div>
             )}
          </div>
        </div>
      </div>

      {/* Footer Instructions */}
      <div className="p-8 bg-slate-900 text-center">
        <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">
          Position the code within the frame
        </p>
      </div>

      <style>{`
        @keyframes scan-line {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan-line {
          animation: scan-line 2.5s ease-in-out infinite;
          position: absolute;
        }
        #reader video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </div>
  );
};
