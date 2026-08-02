"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface BarChartProps {
  categories: string[];
  data: number[];
  color?: string;
  horizontal?: boolean;
  height?: number;
}

export function BarChart({
  categories,
  data,
  color = "#0284c7",
  horizontal,
  height = 280,
}: BarChartProps) {
  const chartData = categories.map((name, i) => ({
    name,
    value: data[i] ?? 0,
  }));

  if (horizontal) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12, fill: "#71717a" }} axisLine={false} tickLine={false} />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: "#71717a" }} axisLine={false} tickLine={false} width={140} />
          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 13 }} />
          <Bar dataKey="value" fill={color} radius={[0, 6, 6, 0]} />
        </RechartsBarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={chartData} margin={{ bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#71717a" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "#71717a" }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 13 }} />
        <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}