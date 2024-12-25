// src/app/page.tsx

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
import { IconType } from "react-icons";
import {
  FaMusic,
  FaHeadphones,
  FaGuitar,
  FaDrum,
  FaMicrophone,
} from "react-icons/fa";
import {
  GiViolin,
  GiSaxophone,
} from "react-icons/gi";
import { MdMusicNote, MdMusicOff } from "react-icons/md"; // Material Design Music Note
import { IoIosMusicalNote } from "react-icons/io"; // Ionicons
import { v4 as uuidv4 } from "uuid"; // For unique keys

/** Represents a single 5s segment's sentiment data */
interface SegmentSentiment {
  timeSec: number;
  valence: {
    value: number;
    target: number;
    speed: number;
  };
  arousal: {
    value: number;
    target: number;
    speed: number;
  };
  dominance: {
    value: number;
    target: number;
    speed: number;
  };
  locked: boolean;
}

/** Genre prediction */
interface GenrePrediction {
  name: string;
  score: number; // 0..1
}

/** Represents a sentiment with its rendering order and opacity */
interface ShuffledSentiment {
  sentiment: "valence" | "arousal" | "dominance";
  opacity: number;
}

/** Represents an individual music note */
interface MusicNoteData {
  id: string;
  angle: number; // Degrees from 0 to 360
  color: string;
  type: IconType;
}

/** Mapping of genre names to corresponding icons */
const genreIconMap: Record<string, IconType> = {
  Pop: FaMusic,
  Rock: FaGuitar,
  HipHop: FaMicrophone,
  EDM: FaHeadphones,
  Classical: GiViolin,
  Jazz: GiSaxophone,
  Metal: FaDrum,
  Country: FaGuitar,
  Blues: FaGuitar,
  Reggae: FaHeadphones,
  Punk: FaDrum,
  RnB: FaMicrophone,
  Folk: FaGuitar,
  // Add more genres and their corresponding icons as needed
};

/** Array of different music note icons */
const noteTypes: IconType[] = [FaMusic, MdMusicNote];

/** Color classes based on sentiments */
const sentimentColorMap: Record<"valence" | "arousal" | "dominance", string[]> = {
  valence: ["text-purple-500", "text-pink-500", "text-indigo-500"],
  arousal: ["text-green-500", "text-teal-500", "text-lime-500"],
  dominance: ["text-yellow-500", "text-orange-500", "text-amber-500"],
};

/** MusicNote Component */
interface MusicNoteProps {
  id: string;
  angle: number;
  color: string;
  type: IconType;
  onAnimationEnd: (id: string) => void;
}

const MusicNote: React.FC<MusicNoteProps> = ({
  id,
  angle,
  color,
  type: Icon,
  onAnimationEnd,
}) => {
  const [style, setStyle] = useState<React.CSSProperties>({
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    opacity: 1,
    transition: "transform 3s ease-out, opacity 3s ease-out",
    pointerEvents: "none", // Prevent interactions
    fontSize: "24px", // Adjust size as needed
  });

  useEffect(() => {
    const distance = 150; // Distance in pixels
    const radians = (angle * Math.PI) / 180;
    const x = distance * Math.cos(radians);
    const y = distance * Math.sin(radians);

    // Trigger the animation after mount
    const timer = setTimeout(() => {
      setStyle({
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
        opacity: 0,
        transition: "transform 3s ease-out, opacity 3s ease-out",
        pointerEvents: "none",
        fontSize: "24px",
      });
    }, 50); // Slight delay to ensure transition

    return () => clearTimeout(timer);
  }, [angle]);

  return (
    <Icon
      style={style}
      className={color}
      onTransitionEnd={() => onAnimationEnd(id)}
      aria-hidden="true" // Decorative element
    />
  );
};

/** Shuffle array helper function */
const shuffleArray = <T,>(array: T[]): T[] => {
  return array.sort(() => Math.random() - 0.5);
};

export default function Home() {
  // ----- STAGE MANAGEMENT -----
  const [stage, setStage] = useState<"idle" | "uploading" | "processing" | "finished">(
    "idle"
  );

  // ----- SEGMENT SENTIMENT DATA -----
  const totalSegments = 12; // 60s / 5s
  const [segments, setSegments] = useState<SegmentSentiment[]>(() =>
    Array.from({ length: totalSegments }, (_, i) => ({
      timeSec: i * 5,
      valence: {
        value: Math.random(),
        target: Math.random(),
        speed: Math.random() * 0.005 + 0.002, // Random speed between 0.002 and 0.007
      },
      arousal: {
        value: Math.random(),
        target: Math.random(),
        speed: Math.random() * 0.005 + 0.002,
      },
      dominance: {
        value: Math.random(),
        target: Math.random(),
        speed: Math.random() * 0.005 + 0.002,
      },
      locked: false,
    }))
  );

  // ----- GENRE DATA -----
  const [genres, setGenres] = useState<GenrePrediction[]>([]);

  // ----- Shuffled Sentiments State -----
  const sentiments: Array<"valence" | "arousal" | "dominance"> = [
    "valence",
    "arousal",
    "dominance",
  ];
  const [shuffledSentiments, setShuffledSentiments] = useState<ShuffledSentiment[]>(
    () => {
      const shuffled = shuffleArray(sentiments);
      const opacities = shuffleArray([0.6, 0.5, 0.4]);
      return shuffled.map((sentiment, index) => ({
        sentiment,
        opacity: opacities[index],
      }));
    }
  );

  // ----- Update Shuffled Sentiments at Intervals -----
  useEffect(() => {
    if (stage !== "processing") return;

    // Shuffle sentiments every 2 seconds
    const shuffleInterval = setInterval(() => {
      const shuffled = shuffleArray(sentiments);
      const opacities = shuffleArray([0.6, 0.5, 0.4]);
      setShuffledSentiments(
        shuffled.map((sentiment, index) => ({
          sentiment,
          opacity: opacities[index],
        }))
      );
    }, 2000); // Change interval as desired

    return () => clearInterval(shuffleInterval);
  }, [stage]);

  // ----- Animation Loop for Sentiment Values -----
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    if (stage !== "processing") return;

    const animate = () => {
      setSegments((prevSegments) =>
        prevSegments.map((seg) => {
          if (seg.locked) return seg;

          // Function to update a sentiment
          const updateSentiment = (
            sentiment: "valence" | "arousal" | "dominance"
          ) => {
            const current = seg[sentiment].value;
            const target = seg[sentiment].target;
            const speed = seg[sentiment].speed;

            let newValue = current;

            if (current < target) {
              newValue += speed;
              if (newValue >= target) {
                newValue = target;
              }
            } else if (current > target) {
              newValue -= speed;
              if (newValue <= target) {
                newValue = target;
              }
            }

            // If target reached, assign a new target and speed
            if (newValue === target) {
              return {
                value: newValue,
                target: Math.random(),
                speed: Math.random() * 0.005 + 0.002,
              };
            }

            return {
              ...seg[sentiment],
              value: newValue,
            };
          };

          return {
            ...seg,
            valence: updateSentiment("valence"),
            arousal: updateSentiment("arousal"),
            dominance: updateSentiment("dominance"),
          };
        })
      );

      rafId.current = requestAnimationFrame(animate);
    };

    rafId.current = requestAnimationFrame(animate);

    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, [stage]);

  // ----- Music Notes State -----
  const [musicNotes, setMusicNotes] = useState<MusicNoteData[]>([]);

  // ----- Effect to Generate Music Notes Continuously -----
  useEffect(() => {
    if (stage !== "processing") return;

    const noteInterval = setInterval(() => {
      // Randomly select a type
      const type = shuffleArray(noteTypes)[0];

      // Randomly select a color
      const color = shuffleArray(["text-red-500", "text-blue-500", "text-green-500"])[0];

      // Randomly select an angle between 0 and 360 degrees
      const angle = Math.random() * 360;

      const newNote: MusicNoteData = {
        id: uuidv4(),
        angle,
        color,
        type,
      };

      setMusicNotes((prev) => [...prev, newNote]);

      // Remove the note after 3s (animation duration)
      setTimeout(() => {
        setMusicNotes((prev) => prev.filter((note) => note.id !== newNote.id));
      }, 3000);
    }, 500); // Generate a new note every 500ms

    return () => clearInterval(noteInterval);
  }, [stage]);

  // ----- Handle File Upload -----
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    // Simple file type validation
    if (!file.type.startsWith("audio/")) {
      setError("Please upload a valid audio file.");
      return;
    }

    setError(null);
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
          i === currentIdx
            ? {
                ...seg,
                locked: true,
                // Upon locking, set target to current value to stop changes
                valence: { ...seg.valence, target: seg.valence.value, speed: 0 },
                arousal: { ...seg.arousal, target: seg.arousal.value, speed: 0 },
                dominance: { ...seg.dominance, target: seg.dominance.value, speed: 0 },
              }
            : seg
        )
      );
      currentIdx++;

      if (currentIdx === totalSegments) {
        clearInterval(intervalId);
        // Simulate genre prediction
        setTimeout(() => {
          const randomGenres = shuffleArray([
            { name: "Pop", score: Math.random() },
            { name: "Rock", score: Math.random() },
            { name: "EDM", score: Math.random() },
            { name: "Classical", score: Math.random() },
            { name: "HipHop", score: Math.random() },
            { name: "Jazz", score: Math.random() },
            { name: "Metal", score: Math.random() },
            { name: "Country", score: Math.random() },
            { name: "Blues", score: Math.random() },
            { name: "Reggae", score: Math.random() },
            { name: "Punk", score: Math.random() },
            { name: "RnB", score: Math.random() },
            { name: "Folk", score: Math.random() },
            // Add more genres as needed
          ])
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
    return (
      <svg width={400} height={400} viewBox="-200 -200 400 400" className="absolute">
        {shuffledSentiments.map(({ sentiment, opacity }, index) => {
          const points = segments.map((seg, i) => {
            const angle = (i / totalSegments) * 2 * Math.PI - Math.PI / 2; // Start from top
            const sentimentValue = seg[sentiment].value;
            const r = 80 + sentimentValue * 50; // Adjust radius based on value
            const x = r * Math.cos(angle);
            const y = r * Math.sin(angle);
            return { x, y };
          });

          const path = generateSmoothPath(points);

          return (
            <path
              key={sentiment}
              d={path}
              fill={`rgba(${getRGB(sentiment)}, ${opacity})`}
              stroke={getStrokeColor(sentiment)}
              strokeWidth={2}
            />
          );
        })}
      </svg>
    );
  };

  /**
   * Get RGB values based on sentiment
   * @param sentiment - "valence" | "arousal" | "dominance"
   * @returns RGB string
   */
  const getRGB = (sentiment: "valence" | "arousal" | "dominance"): string => {
    switch (sentiment) {
      case "valence":
        return "136, 132, 216"; // Purple
      case "arousal":
        return "130, 202, 157"; // Green
      case "dominance":
        return "255, 198, 88"; // Yellow
      default:
        return "0,0,0";
    }
  };

  /**
   * Get stroke color based on sentiment
   * @param sentiment - "valence" | "arousal" | "dominance"
   * @returns Hex color string
   */
  const getStrokeColor = (sentiment: "valence" | "arousal" | "dominance"): string => {
    switch (sentiment) {
      case "valence":
        return "#8884d8";
      case "arousal":
        return "#82ca9d";
      case "dominance":
        return "#ffc658";
      default:
        return "#000000";
    }
  };

  // ----- Prepare Data for Recharts -----
  const prepareRechartsData = () => {
    return segments.map((seg) => ({
      time: `${seg.timeSec}s`,
      Valence: parseFloat(seg.valence.value.toFixed(2)),
      Arousal: parseFloat(seg.arousal.value.toFixed(2)),
      Dominance: parseFloat(seg.dominance.value.toFixed(2)),
    }));
  };

  // ----- Calculate Average Sentiment Values -----
  const calculateAverages = () => {
    const total = segments.length;
    const sum = segments.reduce(
      (acc, seg) => {
        acc.valence += seg.valence.value;
        acc.arousal += seg.arousal.value;
        acc.dominance += seg.dominance.value;
        return acc;
      },
      { valence: 0, arousal: 0, dominance: 0 }
    );

    return {
      valence: parseFloat((sum.valence / total).toFixed(2)),
      arousal: parseFloat((sum.arousal / total).toFixed(2)),
      dominance: parseFloat((sum.dominance / total).toFixed(2)),
    };
  };

  // ----- Render Linear Timeline with Recharts -----
  const renderLinearTimeline = () => {
    if (stage !== "finished") return null;

    const data = prepareRechartsData();
    const averages = calculateAverages();

    return (
      <div className="w-full max-w-4xl bg-white rounded-lg shadow p-6 transition-all duration-500 ease-in-out hover:scale-105">
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
            <Line
              type="monotone"
              dataKey="Valence"
              stroke="#8884d8"
              activeDot={{ r: 8 }}
            />
            <Line type="monotone" dataKey="Arousal" stroke="#82ca9d" />
            <Line type="monotone" dataKey="Dominance" stroke="#ffc658" />
          </LineChart>
        </ResponsiveContainer>
        {/* Display Averages */}
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

  // ----- Render Linear Timeline and Genres -----
  const renderLinearTimelineAndGenres = () => {
    if (stage !== "finished") return null;

    return (
      <div className="flex flex-col md:flex-row w-full max-w-5xl gap-8 transition-all duration-500 ease-in-out">
        {/* Top Genres */}
        <div className="md:w-1/3 bg-white rounded-lg shadow p-6 transition-transform transform duration-500 ease-in-out hover:scale-105">
          <h2 className="text-xl font-semibold mb-4">Top Predicted Genres</h2>
          <ul className="space-y-2">
            {genres.map((genre, idx) => {
              const Icon = genreIconMap[genre.name] || FaMusic; // Default to FaMusic if no icon found
              return (
                <li
                  key={idx}
                  className="flex items-center space-x-3 p-2 bg-gray-100 rounded"
                >
                  <Icon className="text-xl text-indigo-600" />
                  <span className="flex-1 font-medium">{genre.name}</span>
                  <span className="text-sm text-gray-700">
                    {(genre.score * 100).toFixed(1)}%
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Sentiment Timeline */}
        {renderLinearTimeline()}
      </div>
    );
  };

  // ----- Render Speaker with Waves, Pulse, and Animated Music Notes -----
  const renderSpeakerWithWaves = () => {
    return (
      <div className="relative w-[400px] h-[400px] flex items-center justify-center transition-all duration-500 ease-in-out hover:scale-105">
        {/* Circular Area Chart */}
        {renderCircularAreaChart()}

        {/* Speaker Image */}
        <div className="z-10">
          <Image
            src="/speaker.svg"
            alt="Speaker"
            width={120}
            height={120}
            className={`transition-transform duration-500 ${
              stage === "processing" ? "animate-rotate-slow" : ""
            }`}
          />
        </div>

        {/* Animated Music Notes */}
        {musicNotes.map((note) => (
          <MusicNote
            key={note.id}
            id={note.id}
            angle={note.angle}
            color={note.color}
            type={note.type}
            onAnimationEnd={(id) =>
              setMusicNotes((prev) => prev.filter((n) => n.id !== id))
            }
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 transition-all duration-500 ease-in-out">
      <h1 className="text-3xl font-bold">Music Sentiment & Genre Analyzer</h1>

      {/* IDLE: Upload Button */}
      {stage === "idle" && (
        <div className="flex flex-col items-center space-y-4 transition-all duration-500 ease-in-out">
          <label
            htmlFor="upload-audio"
            className="cursor-pointer bg-indigo-600 text-white px-6 py-3 rounded-full hover:bg-indigo-500 transition flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            aria-label="Upload Audio File"
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
          {/* Error Message */}
          {error && <div className="mt-4 text-red-500">{error}</div>}
        </div>
      )}

      {/* UPLOADING */}
      {stage === "uploading" && (
        <div className="flex flex-col items-center space-y-4 transition-all duration-500 ease-in-out">
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

      {/* Tailwind CSS Animations */}
      <style jsx>{`
        @keyframes rotate-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-rotate-slow {
          animation: rotate-slow 20s linear infinite;
        }

        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 0.75;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        .animate-ping-slow {
          animation: ping-slow 4s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
