"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  FaMicrophoneSlash,
} from "react-icons/fa";
import { GiViolin, GiSaxophone } from "react-icons/gi";
import { MdMusicNote, MdMusicOff } from "react-icons/md";
import { IoIosMusicalNote } from "react-icons/io";
import { v4 as uuidv4 } from "uuid";
import { motion, AnimatePresence } from "framer-motion";

/* ============================
   Data Interfaces & Helpers
============================ */
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

const shuffleArray = <T,>(array: T[]): T[] =>
  array.sort(() => Math.random() - 0.5);

const getRGB = (sentiment: "valence" | "arousal" | "dominance"): string => {
  switch (sentiment) {
    case "valence":
      return "136, 132, 216";
    case "arousal":
      return "130, 202, 157";
    case "dominance":
      return "255, 198, 88";
    default:
      return "0,0,0";
  }
};

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

/* ============================
   MusicNote Component
============================ */
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

/* ============================
   RecordModal Component (Framer Motion)
============================ */
interface RecordModalProps {
  onClose: () => void;
  onRecordingComplete: (url: string) => void;
  mics: MediaDeviceInfo[];
  selectedMic: string | null;
  setSelectedMic: (id: string) => void;
}

const RecordModal: React.FC<RecordModalProps> = ({
  onClose,
  onRecordingComplete,
  mics,
  selectedMic,
  setSelectedMic,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const startRecording = async () => {
    try {
      const constraints = { audio: selectedMic ? { deviceId: { exact: selectedMic } } : true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        onRecordingComplete(url);
        stopAudioLevelMonitor();
      };

      // Set up analyser for audio level meter
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      monitorAudioLevel();

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(false);
  };

  const pauseResumeRecording = () => {
    if (!mediaRecorderRef.current) return;
    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const toggleMute = () => {
    if (mediaStreamRef.current) {
      const newMuted = !isMuted;
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !newMuted;
      });
      setIsMuted(newMuted);
    }
  };

  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteTimeDomainData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const normalized = (dataArray[i] - 128) / 128;
      sum += Math.abs(normalized);
    }
    const avg = sum / dataArray.length;
    setAudioLevel(avg);
    animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
  }, []);

  const stopAudioLevelMonitor = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    return () => {
      stopAudioLevelMonitor();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleBackgroundClick}
      >
        <motion.div
          className="bg-white rounded-lg p-6 w-80 shadow-lg"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
        >
          <h2 className="text-xl font-bold mb-4">Record Audio</h2>
          {mics.length > 1 && (
            <select
              value={selectedMic || ""}
              onChange={(e) => setSelectedMic(e.target.value)}
              className="border rounded px-2 py-1 w-full mb-4"
            >
              {mics.map((mic) => (
                <option key={mic.deviceId} value={mic.deviceId}>
                  {mic.label || `Microphone ${mic.deviceId}`}
                </option>
              ))}
            </select>
          )}
          <div className="flex flex-col items-center space-y-3">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-full px-4 py-2 rounded-full transition ${
                isRecording
                  ? "bg-red-600 hover:bg-red-500 animate-pulse"
                  : "bg-green-600 hover:bg-green-500"
              } text-white`}
            >
              {isRecording ? "Stop Recording" : "Start Recording"}
            </button>
            {isRecording && (
              <button
                onClick={pauseResumeRecording}
                className="w-full px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white transition"
              >
                {isPaused ? "Resume Recording" : "Pause Recording"}
              </button>
            )}
            {isRecording && (
              <button
                onClick={toggleMute}
                className="w-full px-4 py-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition"
              >
                {isMuted ? "Unmute Mic" : "Mute Mic"}
              </button>
            )}
            {isRecording && (
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${Math.min(audioLevel * 150, 100)}%` }}
                />
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="mt-4 text-sm text-red-600 hover:underline"
          >
            Cancel
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/* ============================
   Genre & Seeds Component
============================ */
interface GenreSeed {
  label: string;
  icon: IconType;
  color: string;
}

const seeds: GenreSeed[] = [
  { label: "Happy", icon: FaMusic, color: "text-yellow-500" },
  { label: "Sad", icon: FaMicrophoneSlash, color: "text-blue-500" },
  { label: "Excited", icon: FaDrum, color: "text-red-500" },
  { label: "Calm", icon: FaHeadphones, color: "text-green-500" },
];

const GenreAndSeeds: React.FC<{ genre?: GenrePrediction }> = ({ genre }) => {
  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex-1 bg-white rounded-lg shadow p-6 flex flex-col justify-center items-center transition-transform duration-500 hover:scale-105">
        <h3 className="text-xl font-semibold mb-2">Predicted Genre</h3>
        {genre ? (
          <div className="flex items-center space-x-3">
            {React.createElement(genreIconMap[genre.name] || FaMusic, {
              className: "text-3xl text-indigo-600",
            })}
            <span className="text-2xl font-medium">{genre.name}</span>
          </div>
        ) : (
          <span className="text-gray-500">No genre predicted</span>
        )}
      </div>
      <div className="flex-1 bg-white rounded-lg shadow p-6 flex flex-col items-center transition-transform duration-500 hover:scale-105">
        <h3 className="text-xl font-semibold mb-2 text-center">Seeds</h3>
        <div className="flex flex-wrap justify-center gap-2">
          {seeds.map((seed) => (
            <div
              key={seed.label}
              className="flex items-center space-x-1 bg-gray-100 px-3 py-1 rounded-full"
            >
              {React.createElement(seed.icon, { className: `text-2xl ${seed.color}` })}
              <span className="font-medium text-lg text-center">{seed.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ============================
   Main Page Component
============================ */
export default function Home() {
  // ----- STAGE MANAGEMENT -----
  const [stage, setStage] = useState<"idle" | "uploading" | "processing" | "finished">("idle");

  // ----- AUDIO INPUT STATE -----
  const [recording, setRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // ----- Record Modal State -----
  const [showRecordModal, setShowRecordModal] = useState(false);

  // ----- Microphone Selection -----
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<string | null>(null);

  useEffect(() => {
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const audioInputs = devices.filter((d) => d.kind === "audioinput");
        setMics(audioInputs);
        if (audioInputs.length > 0) {
          setSelectedMic(audioInputs[0].deviceId);
        }
      })
      .catch((error) => console.error("Error enumerating devices:", error));
  }, []);

  // ----- SEGMENT SENTIMENT DATA -----
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

  // ----- GENRE DATA -----
  const [genres, setGenres] = useState<GenrePrediction[]>([]);

  // ----- Shuffled Sentiments State -----
  const sentiments: ("valence" | "arousal" | "dominance")[] = [
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

  useEffect(() => {
    if (stage !== "processing") return;
    const shuffleInterval = setInterval(() => {
      const shuffled = shuffleArray(sentiments);
      const opacities = shuffleArray([0.6, 0.5, 0.4]);
      setShuffledSentiments(
        shuffled.map((sentiment, index) => ({
          sentiment,
          opacity: opacities[index],
        }))
      );
    }, 2000);
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
          const updateSentiment = (sentiment: "valence" | "arousal" | "dominance") => {
            const current = seg[sentiment].value;
            const target = seg[sentiment].target;
            const speed = seg[sentiment].speed;
            let newValue = current;
            if (current < target) {
              newValue += speed;
              if (newValue >= target) newValue = target;
            } else if (current > target) {
              newValue -= speed;
              if (newValue <= target) newValue = target;
            }
            if (newValue === target) {
              return {
                value: newValue,
                target: Math.random(),
                speed: Math.random() * 0.005 + 0.002,
              };
            }
            return { ...seg[sentiment], value: newValue };
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

  // ----- Inline Recording Functions (if needed) -----
  const mediaRecorderRefInline = useRef<MediaRecorder | null>(null);
  const inlineMediaStreamRef = useRef<MediaStream | null>(null);
  const startRecordingInline = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedMic ? { deviceId: { exact: selectedMic } } : true,
      });
      inlineMediaStreamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const options = { mimeType };
      const recorder = new MediaRecorder(stream, options);
      let chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: options.mimeType });
        const url = URL.createObjectURL(blob);
        setRecordedAudioUrl(url);
        chunks = [];
        setStage("uploading");
        setTimeout(() => {
          setStage("processing");
          startProcessing();
        }, 2000);
      };
      recorder.start();
      mediaRecorderRefInline.current = recorder;
      setRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setError("Could not access microphone.");
    }
  };

  const stopRecordingInline = () => {
    if (mediaRecorderRefInline.current && recording) {
      mediaRecorderRefInline.current.stop();
      inlineMediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      setRecording(false);
    }
  };

  const toggleMicMute = () => {
    if (inlineMediaStreamRef.current) {
      const newMuted = !isMicMuted;
      inlineMediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !newMuted;
      });
      setIsMicMuted(newMuted);
    }
  };

  const toggleAudioMute = () => {
    setIsAudioMuted((prev) => !prev);
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
            .slice(0, 1);
          setGenres(randomGenres);
          setStage("finished");
        }, 1000);
      }
    }, 5000);
  };

  // ----- Generate Smooth Path -----
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
      <div className="w-full bg-white rounded-lg shadow p-6 transition-transform duration-500 hover:scale-105">
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

  // ----- Render Predicted Genre & Seeds Container -----
  const topGenre =
    genres && genres.length > 0
      ? genres.reduce((max, g) => (g.score > max.score ? g : max), genres[0])
      : null;

  const seedsData: { label: string; icon: IconType; color: string }[] = [
    { label: "Happy", icon: FaMusic, color: "text-yellow-500" },
    { label: "Sad", icon: FaMicrophoneSlash, color: "text-blue-500" },
    { label: "Excited", icon: FaDrum, color: "text-red-500" },
    { label: "Calm", icon: FaHeadphones, color: "text-green-500" },
  ];

  const renderGenreAndSeeds = () => {
    return (
      <div className="flex flex-col gap-4 h-full">
        <div className="flex-1 bg-white rounded-lg shadow p-6 flex flex-col justify-center items-center transition-transform duration-500 hover:scale-105">
          <h3 className="text-xl font-semibold mb-2">Predicted Genre</h3>
          {topGenre ? (
            <div className="flex items-center space-x-3">
              {React.createElement(genreIconMap[topGenre.name] || FaMusic, {
                className: "text-3xl text-indigo-600",
              })}
              <span className="text-2xl font-medium">{topGenre.name}</span>
            </div>
          ) : (
            <span className="text-gray-500">No genre predicted</span>
          )}
        </div>
        <div className="flex-1 bg-white rounded-lg shadow p-6 flex flex-col items-center transition-transform duration-500 hover:scale-105">
          <h3 className="text-xl font-semibold mb-2 text-center">Seeds</h3>
          <div className="flex flex-wrap justify-center gap-2">
            {seedsData.map((seed) => (
              <div
                key={seed.label}
                className="flex items-center space-x-1 bg-gray-100 px-3 py-1 rounded-full"
              >
                {React.createElement(seed.icon, { className: `text-2xl ${seed.color}` })}
                <span className="font-medium text-lg text-center">{seed.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ----- Render Speaker with Waves & Music Notes -----
  const renderSpeakerWithWaves = () => {
    return (
      <div className="relative w-[400px] h-[400px] flex items-center justify-center transition-transform duration-500 hover:scale-105">
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
            onAnimationEnd={(id) =>
              setMusicNotes((prev) => prev.filter((n) => n.id !== id))
            }
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 transition-all duration-500 relative">
      <h1 className="text-3xl font-bold mb-8">Music Sentiment & Genre Analyzer</h1>

      {/* Mute Toggle for Audio Playback */}
      {(stage === "processing" || stage === "finished") &&
        (recordedAudioUrl || uploadedAudioUrl) && (
          <div className="fixed top-4 left-4 z-50">
            <button
              onClick={toggleAudioMute}
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

      {/* Mute Toggle for Mic (when recording inline) */}
      {recording && (
        <div className="fixed top-4 left-16 z-50">
          <button
            onClick={toggleMicMute}
            className="bg-gray-800 text-white p-2 rounded-full focus:outline-none"
            aria-label="Toggle Microphone Mute"
          >
            {isMicMuted ? (
              <FaMicrophoneSlash className="h-6 w-6" />
            ) : (
              <FaMicrophone className="h-6 w-6" />
            )}
          </button>
        </div>
      )}

      {/* IDLE: Upload & Record Buttons */}
      {stage === "idle" && (
        <div className="flex flex-col items-center space-y-4 transition-all duration-500">
          <div className="flex space-x-4">
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
            <button
              onClick={() => setShowRecordModal(true)}
              className="bg-red-600 text-white px-6 py-3 rounded-full hover:bg-red-500 transition flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-red-300"
              aria-label="Record Audio"
            >
              <FaMicrophone className="h-6 w-6" />
              <span>Record Audio</span>
            </button>
          </div>
          <Image src="/speaker.svg" alt="Speaker" width={120} height={120} className="opacity-50" />
          {error && <div className="mt-4 text-red-500">{error}</div>}
        </div>
      )}

      {/* UPLOADING */}
      {stage === "uploading" && (
        <div className="flex flex-col items-center space-y-4 transition-all duration-500">
          <p className="text-lg text-gray-700 animate-pulse">Uploading...</p>
          <Image src="/speaker.svg" alt="Speaker" width={120} height={120} className="relative" />
        </div>
      )}

      {/* PROCESSING: Audio auto-plays */}
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

      {/* FINISHED: Audio does NOT auto-play */}
      {stage === "finished" && (
        <div className="flex flex-col gap-8 w-full max-w-5xl">
          {renderSpeakerWithWaves()}
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex flex-col gap-8 md:w-1/3">
              {renderGenreAndSeeds()}
            </div>
            <div className="md:w-2/3">
              {renderLinearTimeline()}
            </div>
          </div>
          {(recordedAudioUrl || uploadedAudioUrl) && (
            <audio
              src={recordedAudioUrl || uploadedAudioUrl || ""}
              controls
              muted={isAudioMuted}
              className="mt-4"
            />
          )}
        </div>
      )}

      {/* Record Modal */}
      <AnimatePresence>
        {showRecordModal && (
          <RecordModal
            onClose={() => setShowRecordModal(false)}
            onRecordingComplete={(url) => {
              setRecordedAudioUrl(url);
              setShowRecordModal(false);
              setStage("uploading");
              setTimeout(() => {
                setStage("processing");
                startProcessing();
              }, 2000);
            }}
            mics={mics}
            selectedMic={selectedMic}
            setSelectedMic={(id) => setSelectedMic(id)}
          />
        )}
      </AnimatePresence>

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
