'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';

interface QrScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export default function QrScanner({ onScan, onClose }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(true);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  useEffect(() => {
    let animationId: number;
    let detector: BarcodeDetector | null = null;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setError('Camera access denied. Please allow camera permissions to scan tickets.');
        return;
      }

      // Try BarcodeDetector API
      if ('BarcodeDetector' in window) {
        try {
          detector = new BarcodeDetector({ formats: ['qr_code'] });
        } catch {
          // BarcodeDetector not supported for qr_code
        }
      }

      if (!detector) {
        setError(
          'QR scanning is not supported in this browser. Please use Chrome or Edge on Android, or Safari 15.4+ on iOS.',
        );
        return;
      }

      async function scanFrame() {
        if (!scanningRef.current || !videoRef.current || !detector) return;
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0 && scanningRef.current) {
            scanningRef.current = false;
            const data = barcodes[0].rawValue;
            if (data) {
              onScan(data);
              return;
            }
            scanningRef.current = true;
          }
        } catch {
          // Detection error — continue scanning
        }
        animationId = requestAnimationFrame(scanFrame);
      }

      scanFrame();
    }

    startCamera();

    return () => {
      scanningRef.current = false;
      if (animationId) cancelAnimationFrame(animationId);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-sm font-medium text-white">Scan QR Code</p>
        <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={handleClose}>
          ✕ Close
        </Button>
      </div>

      {/* Camera view */}
      <div className="relative flex flex-1 items-center justify-center">
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />

        {/* Viewfinder overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-64 w-64 rounded-2xl border-4 border-white/60" />
        </div>

        {/* Scanning indicator */}
        {!error && (
          <div className="absolute bottom-8 rounded-full bg-black/60 px-4 py-2">
            <p className="text-sm text-white">Point camera at ticket QR code</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 rounded-xl bg-red-900/90 p-6 text-center">
            <p className="text-sm text-red-100">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={handleClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Type declaration for BarcodeDetector (not yet in lib.dom.d.ts)
declare global {
  interface BarcodeDetectorOptions {
    formats?: string[];
  }
  interface DetectedBarcode {
    rawValue: string;
    format: string;
    boundingBox: DOMRectReadOnly;
    cornerPoints: { x: number; y: number }[];
  }
  // eslint-disable-next-line no-var
  var BarcodeDetector: {
    new (options?: BarcodeDetectorOptions): BarcodeDetector;
    getSupportedFormats(): Promise<string[]>;
  };
  interface BarcodeDetector {
    detect(source: ImageBitmapSource): Promise<DetectedBarcode[]>;
  }
}
