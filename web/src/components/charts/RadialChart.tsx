"use client";

interface RadialChartProps {
  label: string;
  value: number;
  color?: string;
  height?: number;
}

export function RadialChart({ label, value, color = "#0284c7", height = 200 }: RadialChartProps) {
  const size = Math.min(height, 200);
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="drop-shadow-sm">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f4f4f5"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-all duration-700 ease-out"
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy="0.35em"
          className="fill-zinc-900 text-2xl font-semibold"
          style={{ fontSize: 24, fontWeight: 600 }}
        >
          {value}%
        </text>
      </svg>
      <span className="text-sm text-zinc-500">{label}</span>
    </div>
  );
}
