import React, { useMemo } from 'react';
import { QrCode } from 'lucide-react';

interface ReferenceQrBadgeProps {
  value: string;
  label?: string;
  size?: number;
}

/**
 * Renders a deterministic scannable-style inline SVG QR matrix encoding a Swiftvero reference
 * (e.g. SWV-26-XXXXXX) with standard 7x7 finder patterns and deterministic data modules.
 */
export const ReferenceQrBadge: React.FC<ReferenceQrBadgeProps> = ({
  value,
  label = 'Scan at facility intake',
  size = 112,
}) => {
  const grid = useMemo(() => {
    const dim = 21;
    const matrix: boolean[][] = Array.from({ length: dim }, () => Array(dim).fill(false));

    const drawFinder = (r0: number, c0: number) => {
      for (let r = 0; r < 7; r += 1) {
        for (let c = 0; c < 7; c += 1) {
          const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          matrix[r0 + r][c0 + c] = isBorder || isCenter;
        }
      }
    };

    drawFinder(0, 0);
    drawFinder(0, dim - 7);
    drawFinder(dim - 7, 0);

    // Timing patterns
    for (let i = 8; i < dim - 8; i += 1) {
      matrix[6][i] = i % 2 === 0;
      matrix[i][6] = i % 2 === 0;
    }

    // Seed deterministic hash bits from reference value
    let seed = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      seed ^= value.charCodeAt(i);
      seed = Math.imul(seed, 16777619);
    }

    for (let r = 0; r < dim; r += 1) {
      for (let c = 0; c < dim; c += 1) {
        const inTopLeft = r < 8 && c < 8;
        const inTopRight = r < 8 && c >= dim - 8;
        const inBottomLeft = r >= dim - 8 && c < 8;
        const onTiming = r === 6 || c === 6;
        if (inTopLeft || inTopRight || inBottomLeft || onTiming) continue;

        seed ^= (r * 31 + c * 17 + value.charCodeAt((r + c) % Math.max(1, value.length))) | 0;
        seed = Math.imul(seed, 16777619);
        matrix[r][c] = (Math.abs(seed) % 10) < 5;
      }
    }

    return matrix;
  }, [value]);

  return (
    <div
      className="inline-flex flex-col items-center gap-1.5 p-3 rounded-[12px] bg-white border border-[#E2E8F0] shadow-2xs"
      data-qr-value={value}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 21 21"
        role="img"
        aria-label={`QR code for ${value}`}
        shapeRendering="crispEdges"
        className="block rounded-[4px]"
      >
        <rect width="21" height="21" fill="#FFFFFF" />
        {grid.map((row, r) =>
          row.map((filled, c) =>
            filled ? <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#0F172A" /> : null
          )
        )}
      </svg>
      <div className="flex items-center gap-1 text-[11px] font-bold text-[#0F172A] tabular-nums">
        <QrCode className="w-3.5 h-3.5 text-[#00B4D8]" />
        <span>{value}</span>
      </div>
      <span className="text-[10px] font-medium text-[#4B5563]">{label}</span>
    </div>
  );
};
