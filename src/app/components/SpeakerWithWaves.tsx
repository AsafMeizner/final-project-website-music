import React, { useState, useEffect } from "react";
import Image from "next/image";
import MusicNote from "./MusicNote";
import { v4 as uuidv4 } from "uuid";
import { shuffleArray, getRGB, getStrokeColor, generateSmoothPath } from "@/app/utils/sentimentHelpers";
import { FaMusic } from "react-icons/fa";
import { MdMusicNote } from "react-icons/md";
import { IconType } from "react-icons";

export interface ServerSegment {
  timeSec: number;
  valence: number;
  arousal: number;
  dominance: number;
}

export interface ShuffledSentiment {
  sentiment: "valence" | "arousal" | "dominance";
  opacity: number;
}
export interface MusicNoteData {
  id: string;
  angle: number;
  color: string;
  type: IconType;
}

interface SpeakerWithWavesProps {
  stage: "idle" | "uploading" | "processing" | "finished";
  animatedSegments: ServerSegment[];
  songName: string;
  artistName: string;
}
const noteTypes: IconType[] = [FaMusic, MdMusicNote];

const SpeakerWithWaves: React.FC<SpeakerWithWavesProps> = ({ stage, animatedSegments, songName, artistName }) => {
  // Sentiment shuffling state
  const sentiments: ("valence" | "arousal" | "dominance")[] = ["valence", "arousal", "dominance"];
  const [shuffledSentiments, setShuffledSentiments] = useState<ShuffledSentiment[]>(
    () => {
      const shuf = shuffleArray(sentiments);
      const opacities = shuffleArray([0.6, 0.5, 0.4]);
      return shuf.map((s, i) => ({ sentiment: s, opacity: opacities[i] }));
    }
  );

  useEffect(() => {
    if (stage !== "processing") return;
    const interval = setInterval(() => {
      const shuf = shuffleArray(sentiments);
      const opacities = shuffleArray([0.6, 0.5, 0.4]);
      setShuffledSentiments(shuf.map((s, i) => ({ sentiment: s, opacity: opacities[i] })));
    }, 2000);
    return () => clearInterval(interval);
  }, [stage, sentiments]);

  // Music notes state
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

  const renderCircularAreaChart = () => {
    return (
      <svg width={400} height={400} viewBox="-200 -200 400 400" className="absolute">
        {shuffledSentiments.map(({ sentiment, opacity }) => {
          const points = animatedSegments.map((seg, i) => {
            const angle = (i / (animatedSegments.length || 1)) * 2 * Math.PI - Math.PI / 2;
            const sentimentValue = seg[sentiment];
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

  return (
    <div className="relative w-[400px] h-[400px] flex items-center justify-center transition-transform duration-500 hover:scale-105">
      {renderCircularAreaChart()}
      <div className="z-10">
        <Image
          src="/speaker.svg"
          alt="Speaker"
          width={120}
          height={120}
          className={`transition-transform duration-500 ${stage === "processing" ? "animate-pulse-scale animate-rotate-slow" : ""}`}
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

export default SpeakerWithWaves;
