"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

/** Represents a single 5s segment's sentiment data */
interface SegmentSentiment {
  timeSec: number;
  valence: number;
  arousal: number;
  dominance: number;
  locked: boolean;
}

/** Wave parameters for each sentiment */
interface WaveParams {
  baseRadius: number;     // Base radius in px
  amplitude: number;      // Wave amplitude
  frequency: number;      // Wave frequency
  phase: number;          // Current phase
  velocity: number;       // Current velocity
  targetVelocity: number; // Target velocity
}

/** Waves state for valence, arousal, dominance */
interface WavesState {
  valence: WaveParams;
  arousal: WaveParams;
  dominance: WaveParams;
}

/** Genre prediction */
interface GenrePrediction {
  name: string;
  score: number; // 0..1
}

export default function Home() {
  // ----- STAGE MANAGEMENT -----
  const [stage, setStage] = useState<"idle" | "uploading" | "processing" | "finished">("idle");

  // ----- SEGMENT SENTIMENT DATA -----
  const totalSegments = 12; // 60s / 5s
  const [segments, setSegments] = useState<SegmentSentiment[]>(() =>
    Array.from({ length: totalSegments }, (_, i) => ({
      timeSec: i * 5,
      valence: Math.random(),
      arousal: Math.random(),
      dominance: Math.random(),
      locked: false,
    }))
  );

  // ----- WAVES STATE -----
  const [waves, setWaves] = useState<WavesState>({
    valence: {
      baseRadius: 70,
      amplitude: 20,
      frequency: 3,
      phase: 0,
      velocity: 0.5,
      targetVelocity: 0.5,
    },
    arousal: {
      baseRadius: 90,
      amplitude: 30,
      frequency: 2,
      phase: 0,
      velocity: 0.3,
      targetVelocity: 0.3,
    },
    dominance: {
      baseRadius: 50,
      amplitude: 15,
      frequency: 4,
      phase: 0,
      velocity: 0.7,
      targetVelocity: 0.7,
    },
  });

  // ----- GENRE DATA -----
  const [genres, setGenres] = useState<GenrePrediction[]>([]);

  // ----- Animation Refs -----
  const rafId = useRef<number | null>(null);
  const lastTime = useRef<number>(0);

  /**
   * Animate waves by updating phase based on velocity
   */
  const animateWaves = (time: number) => {
    const dt = (time - lastTime.current) / 1000; // Delta time in seconds
    lastTime.current = time;

    setWaves((prev) => {
      const next = { ...prev };

      (Object.keys(next) as (keyof WavesState)[]).forEach((key) => {
        const wave = next[key];
        // Smoothly approach target velocity
        const smoothing = 0.2;
        wave.velocity += (wave.targetVelocity - wave.velocity) * smoothing * dt;
        // Update phase
        wave.phase += wave.velocity * dt * 2 * Math.PI;
      });

      return next;
    });

    rafId.current = requestAnimationFrame(animateWaves);
  };

  // ----- Start Animation and Velocity Changes -----
  useEffect(() => {
    if (stage !== "processing") return;

    lastTime.current = performance.now();
    rafId.current = requestAnimationFrame(animateWaves);

    // Randomize target velocity every 3 seconds
    const velocityInterval = setInterval(() => {
      setWaves((prev) => {
        const next = { ...prev };
        (Object.keys(next) as (keyof WavesState)[]).forEach((key) => {
          const wave = next[key];
          wave.targetVelocity = 0.1 + Math.random() * 0.7;
        });
        return next;
      });
    }, 3000);

    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
      clearInterval(velocityInterval);
    };
  }, [stage]);

  // ----- Handle File Upload -----
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setStage("uploading");

    // Simulate upload delay
    setTimeout(() => {
      setStage("processing");
      startProcessing();
    }, 2000);
  };

  // ----- Simulate Processing by Locking Segments -----
  const startProcessing = () => {
    let currentIdx = 0;
    const intervalId = setInterval(() => {
      setSegments((prev) =>
        prev.map((seg, i) =>
          i === currentIdx ? { ...seg, locked: true } : seg
        )
      );
      currentIdx++;

      if (currentIdx === totalSegments) {
        clearInterval(intervalId);
        // Simulate genre prediction
        setTimeout(() => {
          const randomGenres = [
            { name: "Pop", score: Math.random() },
            { name: "Rock", score: Math.random() },
            { name: "EDM", score: Math.random() },
            { name: "Classical", score: Math.random() },
            { name: "Hip-Hop", score: Math.random() },
          ]
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
          setGenres(randomGenres);
          setStage("finished");
        }, 1000);
      }
    }, 5000); // Lock a segment every 5 seconds
  };

  // ----- Generate Smooth Path -----
  /**
   * Generate a smooth SVG path through given points using Catmull-Rom to Bezier conversion
   * @param points - Array of points {x, y}
   * @returns SVG path string
   */
  const generateSmoothPath = (points: { x: number; y: number }[]): string => {
    if (points.length < 2) return "";

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length; i++) {
      const p0 = points[i === 0 ? points.length - 1 : i - 1];
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      const p3 = points[(i + 2) % points.length];

      const cp1x = p1.x + (p2.x - p0.x) * 0.2;
      const cp1y = p1.y + (p2.y - p0.y) * 0.2;
      const cp2x = p2.x - (p3.x - p1.x) * 0.2;
      const cp2y = p2.y - (p3.y - p1.y) * 0.2;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    path += " Z";
    return path;
  };

  // ----- Render Circular Area Chart -----
  const renderCircularAreaChart = () => {
    // Generate points for each sentiment
    const sentiments: Array<"valence" | "arousal" | "dominance"> = ["valence", "arousal", "dominance"];
    const colors: Record<string, string> = {
      valence: "rgba(136, 132, 216, 0.4)", // Purple
      arousal: "rgba(130, 202, 157, 0.4)", // Green
      dominance: "rgba(255, 198, 88, 0.4)", // Yellow
    };
    const strokeColors: Record<string, string> = {
      valence: "#8884d8",
      arousal: "#82ca9d",
      dominance: "#ffc658",
    };

    return (
      <svg
        width={400}
        height={400}
        viewBox="-200 -200 400 400"
        className="absolute"
      >
        {sentiments.map((sentiment) => {
          const points = segments.map((seg, i) => {
            const angle = (i / totalSegments) * 2 * Math.PI - Math.PI / 2; // Start from top
            const sentimentValue = seg[sentiment];
            const wave = waves[sentiment];
            const value = seg.locked ? sentimentValue : Math.abs(Math.sin(wave.frequency * angle + wave.phase)) * 0.5 + 0.5;
            const r = wave.baseRadius + wave.amplitude * value;
            const x = r * Math.cos(angle);
            const y = r * Math.sin(angle);
            return { x, y };
          });

          const path = generateSmoothPath(points);

          return (
            <path
              key={sentiment}
              d={path}
              fill={colors[sentiment]}
              stroke={strokeColors[sentiment]}
              strokeWidth={2}
            />
          );
        })}
      </svg>
    );
  };

  // ----- Prepare Data for Recharts -----
  const prepareRechartsData = () => {
    return segments.map((seg) => ({
      time: `${seg.timeSec}s`,
      Valence: parseFloat(seg.valence.toFixed(2)),
      Arousal: parseFloat(seg.arousal.toFixed(2)),
      Dominance: parseFloat(seg.dominance.toFixed(2)),
    }));
  };

  // ----- Render Linear Timeline with Recharts -----
  const renderLinearTimeline = () => {
    if (stage !== "finished") return null;

    const data = prepareRechartsData();

    return (
      <div className="w-full max-w-4xl mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Sentiment Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis domain={[0, 1]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="Valence" stroke="#8884d8" activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="Arousal" stroke="#82ca9d" />
            <Line type="monotone" dataKey="Dominance" stroke="#ffc658" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // ----- Render Linear Timeline and Genres -----
  const renderLinearTimelineAndGenres = () => {
    if (stage !== "finished") return null;

    return (
      <div className="flex flex-col md:flex-row w-full max-w-5xl mt-8 gap-8">
        {/* Top Genres */}
        <div className="md:w-1/3 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Top Predicted Genres</h2>
          <ul className="space-y-2">
            {genres.map((genre, idx) => (
              <li key={idx} className="flex justify-between">
                <span>{genre.name}</span>
                <span>{(genre.score * 100).toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Sentiment Timeline */}
        {renderLinearTimeline()}
      </div>
    );
  };

  // ----- Render Speaker with Waves -----
  const renderSpeakerWithWaves = () => {
    return (
      <div className="relative w-[400px] h-[400px] flex items-center justify-center">
        {/* Circular Area Chart */}
        {renderCircularAreaChart()}

        {/* Speaker Image */}
        <div className="z-10">
          <Image src="/speaker.svg" alt="Speaker" width={120} height={120} />
        </div>

        {/* Processing Info */}
        {(stage === "processing" || stage === "finished") && (
          <div className="absolute bottom-[-2.5rem] text-sm text-gray-600">
            {stage === "processing"
              ? `Processing segment ${segments.filter(seg => seg.locked).length}/${totalSegments}...`
              : "Processing Complete!"}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
      <h1 className="text-3xl font-bold mb-8">Music Sentiment & Genre Analyzer</h1>

      {/* IDLE: Upload Button */}
      {stage === "idle" && (
        <div className="flex flex-col items-center space-y-4">
          <label
            htmlFor="upload-audio"
            className="cursor-pointer bg-indigo-600 text-white px-6 py-3 rounded-full hover:bg-indigo-500 transition flex items-center space-x-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Upload Audio</span>
          </label>
          <input
            id="upload-audio"
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Image
            src="/speaker.svg"
            alt="Speaker"
            width={120}
            height={120}
            className="opacity-50"
          />
        </div>
      )}

      {/* UPLOADING */}
      {stage === "uploading" && (
        <div className="flex flex-col items-center space-y-4">
          <p className="text-lg text-gray-700 animate-pulse">Uploading...</p>
          <Image
            src="/speaker.svg"
            alt="Speaker"
            width={120}
            height={120}
            className="relative"
          />
        </div>
      )}

      {/* PROCESSING */}
      {stage === "processing" && renderSpeakerWithWaves()}

      {/* FINISHED: Show linear timeline + top genres */}
      {stage === "finished" && (
        <div className="flex flex-col items-center w-full max-w-5xl">
          {/* Speaker with Final Waves */}
          {renderSpeakerWithWaves()}

          {/* Linear Timeline and Genres */}
          {renderLinearTimelineAndGenres()}
        </div>
      )}
    </div>
  );
}
