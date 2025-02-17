"use client";

import React, { useRef, useState, useEffect } from "react";
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
import { GiViolin, GiSaxophone } from "react-icons/gi";
import { MdMusicNote, MdMusicOff } from "react-icons/md";
import { IoIosMusicalNote } from "react-icons/io";
import { v4 as uuidv4 } from "uuid";

/* ============================================================================
   AudioRecorder Component using MediaRecorder API
   ----------------------------------------------------------------------------
   This component requests microphone access, starts/stops recording, and when
   finished creates a URL for the recorded audio. It calls the provided callback
   to notify the parent.
=========================================================================== */
interface AudioRecorderProps {
  onRecordingComplete: (url: string) => void;
}
const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
}) => {
  const [recordedUrl, setRecordedUrl] = useState<string>("");
  const mediaStream = useRef<MediaStream | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<BlobPart[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStream.current = stream;
      mediaRecorder.current = new MediaRecorder(stream);
      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.current.push(e.data);
        }
      };
      mediaRecorder.current.onstop = () => {
        const recordedBlob = new Blob(chunks.current, { type: "audio/webm" });
        const url = URL.createObjectURL(recordedBlob);
        setRecordedUrl(url);
        onRecordingComplete(url);
        chunks.current = [];
      };
      mediaRecorder.current.start();
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      mediaRecorder.current.stop();
    }
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach((track) => track.stop());
    }
  };

  return (
    <div className="flex flex-col items-center p-4 border rounded bg-white shadow">
      <audio controls src={recordedUrl} className="my-2" />
      <div className="flex space-x-4">
        <button
          onClick={startRecording}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500 transition"
        >
          Start Recording
        </button>
        <button
          onClick={stopRecording}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-500 transition"
        >
          Stop Recording
        </button>
      </div>
    </div>
  );
};

/* ============================================================================
   Main Page Component
=========================================================================== */
interface SegmentSentiment {
  timeSec: number;
  valence: { value: number; target: number; speed: number };
  arousal: { value: number; target: number; speed: number };
  dominance: { value: number; target: number; speed: number };
  locked: boolean;
}

interface GenrePrediction {
  name: string;
  score: number;
}

interface ShuffledSentiment {
  sentiment: "valence" | "arousal" | "dominance";
  opacity: number;
}

interface MusicNoteData {
  id: string;
  angle: number;
  color: string;
  type: IconType;
}

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
};

const noteTypes: IconType[] = [FaMusic, MdMusicNote];

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
    pointerEvents: "none",
    fontSize: "24px",
  });

  useEffect(() => {
    const distance = 150;
    const radians = (angle * Math.PI) / 180;
    const x = distance * Math.cos(radians);
    const y = distance * Math.sin(radians);

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
    }, 50);

    return () => clearTimeout(timer);
  }, [angle]);

  return (
    <Icon
      style={style}
      className={color}
      onTransitionEnd={() => onAnimationEnd(id)}
      aria-hidden="true"
    />
  );
};

const shuffleArray = <T,>(array: T[]): T[] =>
  array.sort(() => Math.random() - 0.5);

export default function Home() {
  // Stage management: idle → uploading → processing → finished
  const [stage, setStage] = useState<"idle" | "uploading" | "processing" | "finished">("idle");

  // Audio state: recorded URL and uploaded URL
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // Toggle display of the recorder UI
  const [showRecorder, setShowRecorder] = useState(false);

  // When recording is complete, update state and simulate upload delay
  const handleRecordingComplete = (url: string) => {
    setRecordedAudioUrl(url);
    setShowRecorder(false);
    setStage("uploading");
    setTimeout(() => {
      setStage("processing");
      startProcessing();
    }, 2000);
  };

  // ----- Segment Sentiment Data -----
  const totalSegments = 12;
  const [segments, setSegments] = useState<SegmentSentiment[]>(() =>
    Array.from({ length: totalSegments }, (_, i) => ({
      timeSec: i * 5,
      valence: { value: Math.random(), target: Math.random(), speed: Math.random() * 0.005 + 0.002 },
      arousal: { value: Math.random(), target: Math.random(), speed: Math.random() * 0.005 + 0.002 },
      dominance: { value: Math.random(), target: Math.random(), speed: Math.random() * 0.005 + 0.002 },
      locked: false,
    }))
  );

  // ----- Genre Data -----
  const [genres, setGenres] = useState<GenrePrediction[]>([]);

  // ----- Shuffled Sentiments State -----
  const sentiments: ("valence" | "arousal" | "dominance")[] = ["valence", "arousal", "dominance"];
  const [shuffledSentiments, setShuffledSentiments] = useState<ShuffledSentiment[]>(() => {
    const shuffled = shuffleArray(sentiments);
    const opacities = shuffleArray([0.6, 0.5, 0.4]);
    return shuffled.map((sentiment, index) => ({ sentiment, opacity: opacities[index] }));
  });

  useEffect(() => {
    if (stage !== "processing") return;
    const shuffleInterval = setInterval(() => {
      const shuffled = shuffleArray(sentiments);
      const opacities = shuffleArray([0.6, 0.5, 0.4]);
      setShuffledSentiments(
        shuffled.map((sentiment, index) => ({ sentiment, opacity: opacities[index] }))
      );
    }, 2000);
    return () => clearInterval(shuffleInterval);
  }, [stage]);

  // ----- Animate Sentiment Values -----
  const rafId = useRef<number | null>(null);
  useEffect(() => {
    if (stage !== "processing") return;
    const animate = () => {
      setSegments((prev) =>
        prev.map((seg) => {
          if (seg.locked) return seg;
          const update = (s: "valence" | "arousal" | "dominance") => {
            let newValue = seg[s].value;
            if (newValue < seg[s].target) {
              newValue += seg[s].speed;
              if (newValue >= seg[s].target) newValue = seg[s].target;
            } else if (newValue > seg[s].target) {
              newValue -= seg[s].speed;
              if (newValue <= seg[s].target) newValue = seg[s].target;
            }
            if (newValue === seg[s].target) {
              return { value: newValue, target: Math.random(), speed: Math.random() * 0.005 + 0.002 };
            }
            return { ...seg[s], value: newValue };
          };
          return { ...seg, valence: update("valence"), arousal: update("arousal"), dominance: update("dominance") };
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
  useEffect(() => {
    if (stage !== "processing") return;
    const noteInterval = setInterval(() => {
      const type = shuffleArray(noteTypes)[0];
      const color = shuffleArray(["text-red-500", "text-blue-500", "text-green-500"])[0];
      const angle = Math.random() * 360;
      const newNote: MusicNoteData = { id: uuidv4(), angle, color, type };
      setMusicNotes((prev) => [...prev, newNote]);
      setTimeout(() => {
        setMusicNotes((prev) => prev.filter((note) => note.id !== newNote.id));
      }, 3000);
    }, 500);
    return () => clearInterval(noteInterval);
  }, [stage]);

  // ----- Handle File Upload -----
  const [error, setError] = useState<string | null>(null);
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (!file.type.startsWith("audio/")) {
      setError("Please upload a valid audio file.");
      return;
    }
    setError(null);
    const fileUrl = URL.createObjectURL(file);
    setUploadedAudioUrl(fileUrl);
    setStage("uploading");
    setTimeout(() => {
      setStage("processing");
      startProcessing();
    }, 2000);
  };

  // ----- Simulate Processing (Locking Segments, then Genre Prediction) -----
  const startProcessing = () => {
    let currentIdx = 0;
    const intervalId = setInterval(() => {
      setSegments((prev) =>
        prev.map((seg, i) =>
          i === currentIdx
            ? {
                ...seg,
                locked: true,
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
          ])
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
          setGenres(randomGenres);
          setStage("finished");
        }, 1000);
      }
    }, 5000);
  };

  // ----- Generate Smooth SVG Path -----
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
        {shuffledSentiments.map(({ sentiment, opacity }) => {
          const points = segments.map((seg, i) => {
            const angle = (i / totalSegments) * 2 * Math.PI - Math.PI / 2;
            const sentimentValue = seg[sentiment].value;
            const r = 80 + sentimentValue * 50;
            const x = r * Math.cos(angle);
            const y = r * Math.sin(angle);
            return { x, y };
          });
          const path = generateSmoothPath(points);
          const rgb =
            sentiment === "valence"
              ? "136, 132, 216"
              : sentiment === "arousal"
              ? "130, 202, 157"
              : "255, 198, 88";
          const strokeColor =
            sentiment === "valence"
              ? "#8884d8"
              : sentiment === "arousal"
              ? "#82ca9d"
              : "#ffc658";
          return (
            <path
              key={sentiment}
              d={path}
              fill={`rgba(${rgb}, ${opacity})`}
              stroke={strokeColor}
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
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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

  // ----- Render Linear Timeline and Top Genres -----
  const renderLinearTimelineAndGenres = () => {
    if (stage !== "finished") return null;
    return (
      <div className="flex flex-col md:flex-row w-full max-w-5xl gap-8 transition-all duration-500 ease-in-out">
        <div className="md:w-1/3 bg-white rounded-lg shadow p-6 transition-transform transform duration-500 ease-in-out hover:scale-105">
          <h2 className="text-xl font-semibold mb-4">Top Predicted Genres</h2>
          <ul className="space-y-2">
            {genres.map((genre, idx) => {
              const Icon = genreIconMap[genre.name] || FaMusic;
              return (
                <li key={idx} className="flex items-center space-x-3 p-2 bg-gray-100 rounded">
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
        {renderLinearTimeline()}
      </div>
    );
  };

  // ----- Render Speaker with Waves and Animated Music Notes -----
  const renderSpeakerWithWaves = () => {
    return (
      <div className="relative w-[400px] h-[400px] flex items-center justify-center transition-all duration-500 ease-in-out hover:scale-105">
        {renderCircularAreaChart()}
        <div className="z-10">
          <Image
            src="/speaker.svg"
            alt="Speaker"
            width={120}
            height={120}
            className={`transition-transform duration-500 ${
              stage === "processing" ? "animate-pulse-scale animate-rotate-slow" : ""
            }`}
          />
        </div>
        {musicNotes.map((note) => (
          <MusicNote
            key={note.id}
            id={note.id}
            angle={note.angle}
            color={note.color}
            type={note.type}
            onAnimationEnd={(id) => setMusicNotes((prev) => prev.filter((n) => n.id !== id))}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 relative transition-all duration-500">
      <h1 className="text-3xl font-bold mb-8">Music Sentiment & Genre Analyzer</h1>

      {/* Audio Playback Mute Toggle (shown during processing/finished) */}
      {(stage === "processing" || stage === "finished") &&
        (recordedAudioUrl || uploadedAudioUrl) && (
          <div className="fixed top-4 left-4 z-50">
            <button
              onClick={() => setIsAudioMuted((prev) => !prev)}
              className="bg-gray-800 text-white p-2 rounded-full focus:outline-none"
              aria-label="Toggle Audio Playback Mute"
            >
              {isAudioMuted ? (
                <MdMusicOff className="h-6 w-6" />
              ) : (
                <MdMusicNote className="h-6 w-6" />
              )}
            </button>
          </div>
        )}

      {/* IDLE: Upload & Record Options */}
      {stage === "idle" && (
        <div className="flex flex-col items-center space-y-6">
          <div className="flex space-x-6">
            {/* Upload Audio */}
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

            {/* Record Audio */}
            <button
              onClick={() => setShowRecorder((prev) => !prev)}
              className="bg-red-600 text-white px-6 py-3 rounded-full hover:bg-red-500 transition flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-red-300"
              aria-label="Record Audio"
            >
              <FaMicrophone className="h-6 w-6" />
              <span>Record Audio</span>
            </button>
          </div>
          {/* Show Recorder UI if toggled */}
          {showRecorder && (
            <div className="w-full max-w-md">
              <AudioRecorder onRecordingComplete={handleRecordingComplete} />
            </div>
          )}
          <Image src="/speaker.svg" alt="Speaker" width={120} height={120} className="opacity-50" />
          {error && <div className="mt-4 text-red-500">{error}</div>}
        </div>
      )}

      {/* UPLOADING */}
      {stage === "uploading" && (
        <div className="flex flex-col items-center space-y-4">
          <p className="text-lg text-gray-700 animate-pulse">Uploading...</p>
          <Image src="/speaker.svg" alt="Speaker" width={120} height={120} className="relative" />
        </div>
      )}

      {/* PROCESSING */}
      {stage === "processing" && (
        <>
          {renderSpeakerWithWaves()}
          {(recordedAudioUrl || uploadedAudioUrl) && (
            <audio
              src={recordedAudioUrl || uploadedAudioUrl || ""}
              autoPlay
              controls
              muted={isAudioMuted}
              className="mt-4"
            />
          )}
        </>
      )}

      {/* FINISHED: Show Timeline & Genres */}
      {stage === "finished" && (
        <div className="flex flex-col items-center w-full max-w-5xl space-y-8">
          {renderSpeakerWithWaves()}
          {renderLinearTimelineAndGenres()}
          {(recordedAudioUrl || uploadedAudioUrl) && (
            <audio
              src={recordedAudioUrl || uploadedAudioUrl || ""}
              autoPlay
              controls
              muted={isAudioMuted}
              className="mt-4"
            />
          )}
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
        @keyframes pulse-scale {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }
        .animate-pulse-scale {
          animation: pulse-scale 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
