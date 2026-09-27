import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface BusinessQRCodeProps {
  value?: string;
  size?: number;
  className?: string;
  showLogo?: boolean;
}

export const BusinessQRCode: React.FC<BusinessQRCodeProps> = ({
  value,
  size = 180,
  className = '',
  showLogo = true,
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const resolvedValue = value || `${origin}/verifier?proof_id=proof-loan-001&did=did:biz:sharma001`;

  useEffect(() => {
    let active = true;

    QRCode.toDataURL(resolvedValue, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: Math.max(size * 2, 360), // Crystal-clear high resolution for all mobile cameras
      color: {
        dark: '#0a1424',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch((err) => {
        console.error('QR code generation error:', err);
      });

    return () => {
      active = false;
    };
  }, [resolvedValue, size]);

  if (!dataUrl) {
    return (
      <div
        className={`inline-flex items-center justify-center bg-slate-100 animate-pulse rounded-2xl ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center bg-white rounded-2xl p-2 shadow-sm border border-slate-100 select-none overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={dataUrl}
        alt={`OpenVyapar QR Pass for ${resolvedValue}`}
        className="w-full h-full object-contain rounded-lg"
      />
      {showLogo && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white rounded-xl shadow-md border-2 border-amber-400 flex items-center justify-center">
            <span className="font-display font-black text-[10px] sm:text-xs text-slate-900 tracking-tighter">OV</span>
          </div>
        </div>
      )}
    </div>
  );
};

