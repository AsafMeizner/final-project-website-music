import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
                isRecording ? "bg-red-600 hover:bg-red-500 animate-pulse" : "bg-green-600 hover:bg-green-500"
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
          <button onClick={onClose} className="mt-4 text-sm text-red-600 hover:underline">
            Cancel
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RecordModal;
