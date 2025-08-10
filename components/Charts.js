
'use client';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Filler, Legend } from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Filler, Legend);
export function LineChart({ labels, series }){
  const data = { labels, datasets:[{ label:'推移', data: series, fill:false, tension:.1 }] };
  const options = { plugins:{legend:{display:false}}, scales:{ y:{ beginAtZero:false }}};
  return <Line data={data} options={options} />;
}
export function Donut({ labels, data }){
  return <Doughnut data={{ labels, datasets:[{ data, borderWidth:0 }] }} options={{ plugins:{legend:{ position:'bottom' }}, cutout:'65%' }} />;
}
