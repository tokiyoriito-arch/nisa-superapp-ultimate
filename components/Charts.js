// components/Charts.js
'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Filler,
  Legend
);

// 明示カラーパレット（必要なら好みの色に変更OK）
export const PALETTE = [
  '#0ea5e9', // sky-500
  '#22c55e', // green-500
  '#f97316', // orange-500
  '#a78bfa', // violet-400
  '#ef4444', // red-500
  '#14b8a6', // teal-500
  '#eab308', // amber-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
];

function getColors(n) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(PALETTE[i % PALETTE.length]);
  return out;
}

export function LineChart({ labels = [], series = [], label = '推移' }) {
  const data = {
    labels,
    datasets: [
      {
        label,
        data: series,
        borderColor: PALETTE[0],
        backgroundColor: 'rgba(14,165,233,.18)', // sky-500の薄い塗り
        fill: true,
        tension: 0.25,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { intersect: false, mode: 'index' },
    },
    scales: { y: { beginAtZero: false } },
  };
  return (
    <div style={{ width: '100%', height: 320 }}>
      <Line data={data} options={options} />
    </div>
  );
}

export function Donut({ labels = [], data = [] }) {
  const dataset = {
    data,
    backgroundColor: getColors(data.length),
    borderColor: '#ffffff',
    borderWidth: 2,
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    cutout: '65%',
  };
  return (
    <div style={{ width: '100%', height: 320 }}>
      <Doughnut data={{ labels, datasets: [dataset] }} options={options} />
    </div>
  );
}
