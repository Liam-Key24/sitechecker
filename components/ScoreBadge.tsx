interface ScoreBadgeProps {
  score: number | null;
  size?: 'sm' | 'md' | 'lg';
}

export default function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  if (score === null) {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 ${size === 'lg' ? 'text-sm px-3 py-1' : ''}`}>
        Not Analyzed
      </span>
    );
  }

  const getColor = (score: number) => {
    if (score <= 30) return 'bg-red-100 text-red-800';
    if (score <= 60) return 'bg-yellow-100 text-yellow-800';
    if (score <= 80) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  const getLabel = (score: number) => {
    if (score <= 30) return 'High Priority';
    if (score <= 60) return 'Medium Priority';
    if (score <= 80) return 'Low Priority';
    return 'Skip';
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1',
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${getColor(score)} ${sizeClasses[size]}`}>
      {score}/100 - {getLabel(score)}
    </span>
  );
}

