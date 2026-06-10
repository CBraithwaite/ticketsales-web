'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface ScanResultData {
  type: 'valid' | 'already_scanned' | 'invalid' | 'refunded';
  holderName?: string;
  tierName?: string;
  message?: string;
}

interface ScanResultProps {
  result: ScanResultData;
  onDismiss: () => void;
}

const CONFIG = {
  valid: {
    bg: 'bg-green-600',
    icon: '✓',
    title: 'Valid Ticket',
  },
  already_scanned: {
    bg: 'bg-orange-600',
    icon: '✕',
    title: 'Already Scanned',
  },
  invalid: {
    bg: 'bg-red-600',
    icon: '✕',
    title: 'Invalid Ticket',
  },
  refunded: {
    bg: 'bg-red-700',
    icon: '✕',
    title: 'Ticket Refunded',
  },
} as const;

export default function ScanResult({ result, onDismiss }: ScanResultProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  // Haptic feedback
  useEffect(() => {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(result.type === 'valid' ? [100] : [100, 50, 100]);
      }
    } catch {
      // Vibration not supported
    }
  }, [result.type]);

  const config = CONFIG[result.type];

  return (
    <div
      className={cn(
        'fixed inset-0 z-60 flex flex-col items-center justify-center',
        config.bg,
      )}
      onClick={onDismiss}
      role="status"
      aria-live="assertive"
    >
      {/* Icon */}
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white/20 text-5xl text-white">
        {config.icon}
      </div>

      {/* Title */}
      <h2 className="text-3xl font-bold text-white">{config.title}</h2>

      {/* Details */}
      {result.holderName && (
        <p className="mt-3 text-xl text-white/90">{result.holderName}</p>
      )}
      {result.tierName && (
        <p className="mt-1 text-lg text-white/70">{result.tierName}</p>
      )}
      {result.message && (
        <p className="mt-3 text-base text-white/80">{result.message}</p>
      )}

      {/* Dismiss hint */}
      <p className="mt-8 text-sm text-white/50">Tap anywhere to dismiss</p>
    </div>
  );
}
