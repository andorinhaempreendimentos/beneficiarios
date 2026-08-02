"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface DonutChartProps {
  labels: string[];
  series: number[];
  colors: string[];
  height?: number;
}

export function DonutChart({ labels, series, colors, height = 260 }: DonutChartProps) {
  const data = labels.map((name, i) => ({ name, value: series[i] ?? 0 }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius="55%"
          outerRadius="80%"
          dataKey="value"
          paddingAngle={3}
          cornerRadius={4}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 13 }}
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: "#71717a" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
