import React, { useRef, useState, useEffect, useMemo } from "react";

interface MusicPlayerProps {
  audioUrl: string;
  songName: string;
  artistName: string;
  autoPlay?: boolean;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({
  audioUrl,
  songName,
  artistName,
  autoPlay = false,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // --- Random Disc Design Setup ---

  // Define several design variants – each is an array of five path strings.
  const designVariants = useMemo(() => {
    return [
      // Variant 1: (Original-ish curves)
      [
        "M0 128 Q32 64 64 128 T128 128",
        "M0 128 Q32 48 64 128 T128 128",
        "M0 128 Q32 32 64 128 T128 128",
        "M0 128 Q16 64 32 128 T64 128",
        "M64 128 Q80 64 96 128 T128 128",
      ],
      // Variant 2: Cubic Bezier curves for a more dramatic look
      [
        "M0 128 C32 0, 96 0, 128 128",
        "M0 128 C32 96, 96 96, 128 128",
        "M0 128 C32 112, 96 112, 128 128",
        "M0 128 C32 80, 96 80, 128 128",
        "M0 128 C32 64, 96 64, 128 128",
      ],
      // Variant 3: Arcs and straight line for a different aesthetic
      [
        "M64 128 A64 64 0 0 1 0 64",
        "M64 128 A64 64 0 0 0 128 64",
        "M64 0 A64 64 0 0 1 128 64",
        "M64 0 A64 64 0 0 0 0 64",
        "M0 64 L128 64",
      ],
    ];
  }, []);

  // Randomly select one design variant for this run.
  const selectedVariant = useMemo(() => {
    const index = Math.floor(Math.random() * designVariants.length);
    return designVariants[index];
  }, [designVariants]);

  // Curated palette of colors.
  const randomPathColors = useMemo(() => {
    const palette = [
      "#FFD700", // Gold
      "#800080", // Purple
      "#000000", // Black
      "#FF0000", // Red
      "#0000FF", // Blue
      "#008000", // Green
      "#FF8C00", // DarkOrange
      "#FF69B4", // HotPink
      "#00BFFF", // DeepSkyBlue
      "#4B0082", // Indigo
    ];
    const available = [...palette];
    for (let i = available.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [available[i], available[j]] = [available[j], available[i]];
    }
    return available.slice(0, 5);
  }, []);

  // --- Audio Controls ---
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, []);

  useEffect(() => {
    if (autoPlay && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [autoPlay]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Freeze spin (large & small discs) when paused without resetting orientation.
  const spinStyle = { animationPlayState: isPlaying ? "running" : "paused" };

  return (
    <div className="flex flex-col items-center group/he select-none">
      {/* Large Disk */}
      <div className="relative z-0 h-16 -mb-2 transition-all duration-200 group-hover/he:h-0">
        <svg
          width={128}
          height={128}
          viewBox="0 0 128 128"
          className="duration-500 border-4 rounded-full shadow-md border-zinc-400 border-spacing-5 animate-[spin_5s_linear_infinite] transition-all"
          style={spinStyle}
        >
          <svg>
            <rect width={128} height={128} fill="black" />
            <circle cx={20} cy={20} r={2} fill="white" />
            <circle cx={40} cy={30} r={2} fill="white" />
            <circle cx={60} cy={10} r={2} fill="white" />
            <circle cx={80} cy={40} r={2} fill="white" />
            <circle cx={100} cy={20} r={2} fill="white" />
            <circle cx={120} cy={50} r={2} fill="white" />
            <circle cx={90} cy={30} r={10} fill="white" fillOpacity="0.5" />
            <circle cx={90} cy={30} r={8} fill="white" />
            {selectedVariant.map((d, i) => (
              <path key={i} d={d} fill={randomPathColors[i]} stroke="black" strokeWidth={1} />
            ))}
          </svg>
        </svg>
        <div className="absolute z-10 w-8 h-8 bg-white border-4 rounded-full shadow-sm border-zinc-400 top-12 left-12" />
      </div>

      {/* Control Panel */}
      <div className="z-30 flex flex-col w-40 h-20 transition-all duration-300 bg-white shadow-md group-hover/he:h-40 group-hover/he:w-72 rounded-2xl shadow-zinc-400">
        <div className="flex flex-row w-full h-0 group-hover/he:h-20">
          {/* Small Disk Container: scales down when hidden */}
          <div className="relative flex items-center justify-center w-24 h-24 transform scale-50 group-hover/he:scale-100 group-hover/he:-top-6 group-hover/he:-left-4 opacity-0 group-hover/he:opacity-100 transition-all duration-100">
            <svg
              width={96}
              height={96}
              viewBox="0 0 128 128"
              className="duration-500 border-4 rounded-full shadow-md border-zinc-400 border-spacing-5 animate-[spin_5s_linear_infinite]"
              style={spinStyle}
            >
              <svg>
                <rect width={128} height={128} fill="black" />
                <circle cx={20} cy={20} r={2} fill="white" />
                <circle cx={40} cy={30} r={2} fill="white" />
                <circle cx={60} cy={10} r={2} fill="white" />
                <circle cx={80} cy={40} r={2} fill="white" />
                <circle cx={100} cy={20} r={2} fill="white" />
                <circle cx={120} cy={50} r={2} fill="white" />
                <circle cx={90} cy={30} r={10} fill="white" fillOpacity="0.5" />
                <circle cx={90} cy={30} r={8} fill="white" />
                {selectedVariant.map((d, i) => (
                  <path key={i} d={d} fill={randomPathColors[i]} stroke="black" strokeWidth={1} />
                ))}
              </svg>
            </svg>
            <div className="absolute z-10 w-6 h-6 bg-white border-4 rounded-full shadow-sm border-zinc-400 top-9 left-9" />
          </div>
          <div className="flex flex-col justify-center w-full pl-3 -ml-24 overflow-hidden group-hover/he:-ml-3 text-nowrap">
            <p className="text-xl font-bold">{songName}</p>
            <p className="text-zinc-600">{artistName}</p>
          </div>
        </div>
        <div className="flex flex-row mx-3 mt-3 bg-indigo-100 rounded-md min-h-4 group-hover/he:mt-0">
          <span className="hidden pl-3 text-sm text-zinc-600 group-hover/he:inline-block">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={duration ? (currentTime / duration) * 100 : 0}
            onChange={(e) => {
              const newTime = (parseFloat(e.target.value) / 100) * duration;
              if (audioRef.current) {
                audioRef.current.currentTime = newTime;
              }
              setCurrentTime(newTime);
            }}
            className="w-24 group-hover/he:w-full flex-grow h-1 mx-2 my-auto bg-gray-300 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-zinc-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md"
          />
          <span className="hidden pr-3 text-sm text-zinc-600 group-hover/he:inline-block">
            {formatTime(duration)}
          </span>
        </div>
        {/* Control Buttons: Only Skip Back 10 sec, Play/Pause, Skip Forward 10 sec */}
        <div className="flex flex-row items-center justify-center flex-grow mx-3 space-x-5">
          <div
            className="flex items-center justify-center w-12 h-full cursor-pointer"
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
                setCurrentTime(audioRef.current.currentTime);
              }
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={24}
              height={24}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="feather feather-skip-back"
            >
              <polygon points="19 20 9 12 19 4 19 20" />
              <line x1={5} y1={19} x2={5} y2={5} />
            </svg>
          </div>
          <div
            className="flex items-center justify-center w-12 h-full cursor-pointer"
            onClick={togglePlayPause}
          >
            {isPlaying ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={24}
                height={24}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="feather feather-pause"
              >
                <rect x={6} y={4} width={4} height={16} />
                <rect x={14} y={4} width={4} height={16} />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={24}
                height={24}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="feather feather-play"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </div>
          <div
            className="flex items-center justify-center w-12 h-full cursor-pointer"
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration);
                setCurrentTime(audioRef.current.currentTime);
              }
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={24}
              height={24}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="feather feather-skip-forward"
            >
              <polygon points="5 4 15 12 5 20 5 4" />
              <line x1={19} y1={5} x2={19} y2={19} />
            </svg>
          </div>
        </div>
      </div>
      <audio ref={audioRef} src={audioUrl} className="hidden" />
    </div>
  );
};

export default MusicPlayer;
