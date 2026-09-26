import React, { useMemo } from 'react';
import QRCode from 'qrcode';

interface BusinessQRCodeProps {
  value?: string;
  size?: number;
  className?: string;
  showLogo?: boolean;
}

export const BusinessQRCode: React.FC<BusinessQRCodeProps> = ({
  value = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  size = 180,
  className = '',
  showLogo = true,
}) => {
  const qrData = useMemo(() => {
    try {
      const qr = QRCode.create(value, {
        errorCorrectionLevel: showLogo ? 'H' : 'M',
      });
      const moduleCount = qr.modules.size;
      const data: boolean[][] = [];

      for (let r = 0; r < moduleCount; r++) {
        const row: boolean[] = [];
        for (let c = 0; c < moduleCount; c++) {
          row.push(Boolean(qr.modules.get(r, c)));
        }
        data.push(row);
      }

      return {
        moduleCount,
        data,
      };
    } catch {
      return null;
    }
  }, [value, showLogo]);

  if (!qrData) {
    return (
      <div
        className={`inline-flex items-center justify-center bg-slate-100 animate-pulse rounded-2xl ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  const { moduleCount, data } = qrData;
  const cellSize = 10;
  const margin = 2.5; // Quiet zone in modules
  const totalGrid = moduleCount + margin * 2;
  const totalDimension = totalGrid * cellSize;

  // Helper to check if coordinates are within standard 7x7 finder patterns
  const isFinderPattern = (r: number, c: number) => {
    if (r < 7 && c < 7) return true; // Top-Left
    if (r < 7 && c >= moduleCount - 7) return true; // Top-Right
    if (r >= moduleCount - 7 && c < 7) return true; // Bottom-Left
    return false;
  };

  // Helper to check if cell is under the center emblem
  const isLogoArea = (r: number, c: number) => {
    if (!showLogo) return false;
    const mid = Math.floor(moduleCount / 2);
    // Keep 5x5 module area clear in the center for the logo (within 30% H-level error budget)
    return Math.abs(r - mid) <= 2 && Math.abs(c - mid) <= 2;
  };

  const renderFinderPattern = (x: number, y: number) => {
    const finderSize = 7 * cellSize;
    return (
      <g transform={`translate(${x}, ${y})`}>
        {/* Outer squircle border */}
        <rect
          x={0}
          y={0}
          width={finderSize}
          height={finderSize}
          rx={cellSize * 1.8}
          fill="#0a1424"
        />
        {/* White inner spacer */}
        <rect
          x={cellSize}
          y={cellSize}
          width={finderSize - cellSize * 2}
          height={finderSize - cellSize * 2}
          rx={cellSize * 1.1}
          fill="#ffffff"
        />
        {/* Inner solid rounded eye */}
        <rect
          x={cellSize * 2}
          y={cellSize * 2}
          width={cellSize * 3}
          height={cellSize * 3}
          rx={cellSize * 0.9}
          fill="#0a1424"
        />
      </g>
    );
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none bg-white rounded-2xl p-2.5 shadow-sm border border-slate-100 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox={`0 0 ${totalDimension} ${totalDimension}`}
        width="100%"
        height="100%"
        className="w-full h-full"
        shapeRendering="geometricPrecision"
      >
        {/* Crisp white background */}
        <rect
          width={totalDimension}
          height={totalDimension}
          rx={16}
          fill="#ffffff"
        />

        {/* Finder Pattern 1: Top-Left */}
        {renderFinderPattern(margin * cellSize, margin * cellSize)}

        {/* Finder Pattern 2: Top-Right */}
        {renderFinderPattern(
          (margin + moduleCount - 7) * cellSize,
          margin * cellSize
        )}

        {/* Finder Pattern 3: Bottom-Left */}
        {renderFinderPattern(
          margin * cellSize,
          (margin + moduleCount - 7) * cellSize
        )}

        {/* Rounded Data Modules */}
        <g transform={`translate(${margin * cellSize}, ${margin * cellSize})`}>
          {data.map((row, rIdx) =>
            row.map((isDark, cIdx) => {
              if (!isDark) return null;
              if (isFinderPattern(rIdx, cIdx)) return null;
              if (isLogoArea(rIdx, cIdx)) return null;

              const x = cIdx * cellSize;
              const y = rIdx * cellSize;
              const dotPadding = cellSize * 0.08;
              const dotSize = cellSize - dotPadding * 2;

              return (
                <rect
                  key={`${rIdx}-${cIdx}`}
                  x={x + dotPadding}
                  y={y + dotPadding}
                  width={dotSize}
                  height={dotSize}
                  rx={cellSize * 0.38}
                  fill="#0a1424"
                />
              );
            })
          )}
        </g>

        {/* Center Emblem: OpenVyapar Crest */}
        {showLogo && (
          <g
            transform={`translate(${totalDimension / 2}, ${
              totalDimension / 2
            })`}
          >
            {/* White pill background */}
            <rect
              x={-cellSize * 2.7}
              y={-cellSize * 2.7}
              width={cellSize * 5.4}
              height={cellSize * 5.4}
              rx={cellSize * 1.5}
              fill="#ffffff"
              stroke="#e2e8f0"
              strokeWidth={1.5}
            />
            {/* Inner Dark Badge */}
            <rect
              x={-cellSize * 2}
              y={-cellSize * 2}
              width={cellSize * 4}
              height={cellSize * 4}
              rx={cellSize * 1.1}
              fill="#0a1424"
              stroke="#f59e0b"
              strokeWidth={1.2}
            />
            {/* Golden Geometric 'V' */}
            <g transform="translate(-16, -16) scale(0.8)">
              <path
                d="M11 13H16.8L20 23.5L23.2 13H29L22.5 28.5H17.5L11 13Z"
                fill="#f59e0b"
              />
            </g>
          </g>
        )}
      </svg>
    </div>
  );
};
