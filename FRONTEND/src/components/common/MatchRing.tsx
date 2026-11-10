import React from 'react';

interface MatchRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

export const MatchRing: React.FC<MatchRingProps> = ({
  score,
  size = 68,
  strokeWidth = 6,
  showLabel = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 75) return '#10b981'; // emerald
    if (s >= 55) return '#8b5cf6'; // purple
    return '#f59e0b'; // amber
  };

  const ringColor = getColor(normalizedScore);

  return (
    <div className="relative inline-flex flex-col items-center justify-center shrink-0">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1e293b"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-sm font-bold tracking-tight text-white font-mono tabular-nums">
          {normalizedScore}%
        </span>
        {showLabel && size >= 70 && (
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-medium -mt-0.5">
            Match
          </span>
        )}
      </div>
    </div>
  );
};
