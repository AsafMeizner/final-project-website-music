"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { v4 as uuidv4 } from "uuid";
import { motion, AnimatePresence } from "framer-motion";
import MusicPlayer from "@/app/components/musicPlayer";
import TopMenu from "@/app/components/TopMenu";
import AudioUploadControls from "@/app/components/AudioUploadControls";
import RecordModal from "@/app/components/RecordModal";
import SpeakerWithWaves from "@/app/components/SpeakerWithWaves";
import TimelineChart from "@/app/components/TimelineChart";
import GenreAndSeeds from "@/app/components/GenreAndSeeds";
import { analyzeAudio } from "@/app/sentimentActions";
import { shuffleArray } from "@/app/utils/sentimentHelpers";

// Data interfaces
interface ServerSegment {
  timeSec: number;
  valence: number;
  arousal: number;
  dominance: number;
}

interface ShuffledSentiment {
  sentiment: "valence" | "arousal" | "dominance";
  opacity: number;
}

export default function Home() {
  // Stage management
  const [stage, setStage] = useState<"idle" | "uploading" | "processing" | "finished">("idle");

  // Audio state
  const [recording, setRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // Record modal state
  const [showRecordModal, setShowRecordModal] = useState(false);

  // Microphone selection
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<string | null>(null);

  // Song metadata
  const [songName, setSongName] = useState("Unknown");
  const [artistName, setArtistName] = useState("Unknown");

  // Sentiment data & animation
  const [serverSegments, setServerSegments] = useState<ServerSegment[]>([]);
  const [animatedSegments, setAnimatedSegments] = useState<ServerSegment[]>([]);
  const [predictedGenre, setPredictedGenre] = useState<string | null>(null);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Mobile navbar visibility
  const [showMobileNavbar, setShowMobileNavbar] = useState(true);
  const lastScrollY = useRef(0);
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth < 768) {
        if (window.scrollY > lastScrollY.current) {
          setShowMobileNavbar(false);
        } else {
          setShowMobileNavbar(true);
        }
        lastScrollY.current = window.scrollY;
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Enumerate devices for recording
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

  // When stage finishes, scroll to bottom
  useEffect(() => {
    if (stage === "finished") {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
  }, [stage]);

  // Animation function for server segments
  const animateSegments = (segments: ServerSegment[]) => {
    let currentIdx = 0;
    const intervalId = setInterval(() => {
      setAnimatedSegments((prev) => [...prev, segments[currentIdx]]);
      currentIdx++;
      if (currentIdx >= segments.length) {
        clearInterval(intervalId);
        setStage("finished");
      }
    }, 2000);
  };

  // Process audio file/recording
  const processAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob);
      const { segments, genre } = await analyzeAudio(formData);
      setServerSegments(segments);
      setPredictedGenre(genre);
      setStage("uploading");
      setTimeout(() => {
        setStage("processing");
        animateSegments(segments);
      }, 2000);
    } catch (err) {
      console.error("Error processing audio:", err);
      setError("There was an error processing your audio. Please try again.");
    }
  };

  // Handle file upload from idle controls
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (!file.type.startsWith("audio/")) {
      setError("Please upload a valid audio file.");
      return;
    }
    setError(null);
    setSongName(file.name);
    setArtistName("Unknown");
    processAudio(file);
  };

  // Inline recording functions
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
        setStage("uploading");
        processAudio(blob);
      };
      recorder.start();
      mediaRecorderRefInline.current = recorder;
      setRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
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

  // Reset app to initial state
  const resetApp = () => {
    setStage("idle");
    setRecordedAudioUrl(null);
    setUploadedAudioUrl(null);
    setPredictedGenre(null);
    setServerSegments([]);
    setAnimatedSegments([]);
  };

  // Render MusicPlayer if an audio URL is available
  const renderMusicPlayer = () => {
    const audioUrl = recordedAudioUrl || uploadedAudioUrl;
    if (!audioUrl) return null;
    return (
      <MusicPlayer
        audioUrl={audioUrl}
        songName={songName}
        artistName={artistName}
        autoPlay={stage === "processing"}
      />
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 transition-all duration-500 relative">
      {/* Top Menu */}
      <TopMenu
        isAudioMuted={isAudioMuted}
        toggleAudioMute={toggleAudioMute}
        resetApp={resetApp}
        showNavbar={showMobileNavbar}
      />

      <h1 className="text-3xl font-bold mb-8">Music Sentiment & Genre Analyzer</h1>

      {/* Mute toggle for inline recording */}
      {recording && (
        <div className="fixed top-4 left-16 z-50">
          <button
            onClick={toggleMicMute}
            className="bg-gray-800 text-white p-2 rounded-full focus:outline-none"
            aria-label="Toggle Microphone Mute"
          >
            {isMicMuted ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 4.879V2a1 1 0 112 0v2.879l1.292-1.293a1 1 0 111.415 1.414L12.414 7l2.293 2.293a1 1 0 01-1.415 1.414L11 8.414l-2.293 2.293a1 1 0 01-1.414-1.414L9.586 7 7.293 4.707a1 1 0 111.414-1.414L9 4.879z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a1 1 0 00-1 1v5.586l-1.293-1.293a1 1 0 00-1.414 1.414L7.586 11 5.293 13.293a1 1 0 001.414 1.414L9 12.414V18a1 1 0 002 0v-5.586l1.293 1.293a1 1 0 001.414-1.414L12.414 11l2.293-2.293a1 1 0 00-1.414-1.414L11 8.586V3a1 1 0 00-1-1z" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* IDLE: Upload & Record */}
      {stage === "idle" && (
        <AudioUploadControls onFileUpload={handleFileUpload} onRecordClick={() => setShowRecordModal(true)} error={error} />
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
        <div className="flex flex-col items-center">
          <SpeakerWithWaves stage={stage} animatedSegments={animatedSegments} songName={songName} artistName={artistName} />
          {renderMusicPlayer()}
        </div>
      )}

      {/* FINISHED: Audio does not auto-play */}
      {stage === "finished" && (
        <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto items-center">
          <SpeakerWithWaves stage={stage} animatedSegments={animatedSegments} songName={songName} artistName={artistName} />
          {renderMusicPlayer()}
          <div className="flex flex-col md:flex-row gap-8 items-stretch">
            <div className="flex flex-col gap-8 md:w-1/3 items-center">
              <GenreAndSeeds genre={predictedGenre || undefined} />
            </div>
            <div className="md:w-2/3 flex justify-center w-full">
              <TimelineChart animatedSegments={animatedSegments} />
            </div>
          </div>
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
              fetch(url)
                .then((res) => res.blob())
                .then(processAudio);
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

      {/* Asaf Meizner Signature */}
      <div className="button mt-4 relative md:fixed md:mt-0 md:top-6 md:right-12 scale-125 rounded-lg overflow-hidden">
        <div className="box">A</div>
        <div className="box"> </div>
        <div className="box">S</div>
        <div className="box"> </div>
        <div className="box">A</div>
        <div className="box"> </div>
        <div className="box">F</div>
      </div>
    </div>
  );
}
