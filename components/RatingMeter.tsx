interface RatingMeterProps {
  label: string;
  score: number | null | undefined;
  sublabel?: string;
}

function clamp0to100(value: number) {
  return Math.min(100, Math.max(0, value));
}

function getColor(score: number) {
  if (score <= 30) return 'bg-red-500';
  if (score <= 60) return 'bg-yellow-500';
  if (score <= 80) return 'bg-blue-500';
  return 'bg-primary';
}

export default function RatingMeter({ label, score, sublabel }: RatingMeterProps) {
  const hasScore = typeof score === 'number' && Number.isFinite(score);
  const safe = hasScore ? clamp0to100(score) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-gray-900">{label}</div>
          {sublabel && <div className="text-xs text-gray-600">{sublabel}</div>}
        </div>
        <div className="text-sm font-semibold text-gray-900 tabular-nums">
          {hasScore ? `${Math.round(safe)}/100` : 'N/A'}
        </div>
      </div>

      <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full ${hasScore ? getColor(safe) : 'bg-gray-400'}`}
          style={{ width: `${safe}%` }}
        />
      </div>
    </div>
  );
}

