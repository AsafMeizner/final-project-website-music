import React, { ChangeEvent } from "react";
import Image from "next/image";
import { FaMicrophone } from "react-icons/fa";

interface AudioUploadControlsProps {
  onFileUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  onRecordClick: () => void;
  error?: string | null;
}

const AudioUploadControls: React.FC<AudioUploadControlsProps> = ({ onFileUpload, onRecordClick, error }) => {
  return (
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
        <input id="upload-audio" type="file" accept="audio/*" onChange={onFileUpload} className="hidden" />
        <button
          onClick={onRecordClick}
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
  );
};

export default AudioUploadControls;
