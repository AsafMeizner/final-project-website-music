import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { ServerSegment } from "./SpeakerWithWaves";

interface TimelineChartProps {
  animatedSegments: ServerSegment[];
}

const TimelineChart: React.FC<TimelineChartProps> = ({ animatedSegments }) => {
  const data = animatedSegments.map((seg) => ({
    time: `${seg.timeSec}s`,
    Valence: parseFloat(seg.valence.toFixed(2)),
    Arousal: parseFloat(seg.arousal.toFixed(2)),
    Dominance: parseFloat(seg.dominance.toFixed(2)),
  }));

  const total = animatedSegments.length;
  const sum = animatedSegments.reduce(
    (acc, seg) => {
      acc.valence += seg.valence;
      acc.arousal += seg.arousal;
      acc.dominance += seg.dominance;
      return acc;
    },
    { valence: 0, arousal: 0, dominance: 0 }
  );

  const averages =
    total > 0
      ? {
          valence: parseFloat((sum.valence / total).toFixed(2)),
          arousal: parseFloat((sum.arousal / total).toFixed(2)),
          dominance: parseFloat((sum.dominance / total).toFixed(2)),
        }
      : { valence: 0, arousal: 0, dominance: 0 };

  return (
    <div className="w-full bg-white flex flex-col items-center rounded-lg shadow p-6 transition-transform duration-500 hover:scale-105">
      <h2 className="text-xl font-semibold mb-4">Sentiment Over Time</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis domain={[0, 1]} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="Valence" stroke="#8884d8" />
          <Line type="monotone" dataKey="Arousal" stroke="#82ca9d" />
          <Line type="monotone" dataKey="Dominance" stroke="#ffc658" />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-4 flex space-x-6">
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 bg-[#8884d8] rounded-full"></span>
          <span>Average Valence: {averages.valence}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 bg-[#82ca9d] rounded-full"></span>
          <span>Average Arousal: {averages.arousal}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 bg-[#ffc658] rounded-full"></span>
          <span>Average Dominance: {averages.dominance}</span>
        </div>
      </div>
    </div>
  );
};

export default TimelineChart;
