import React from "react";
import { MdMusicNote, MdMusicOff } from "react-icons/md";
import { FaBook } from "react-icons/fa";

interface TopMenuProps {
  isAudioMuted: boolean;
  toggleAudioMute: () => void;
  resetApp: () => void;
  showNavbar: boolean;
}

const TopMenu: React.FC<TopMenuProps> = ({ isAudioMuted, toggleAudioMute, resetApp, showNavbar }) => {
  return (
    <div
      className={`fixed transition-transform duration-300 z-50 
        ${showNavbar ? "translate-y-0" : "-translate-y-full"} 
        top-0 left-0 w-full bg-gray-800 shadow md:top-4 md:left-4 md:w-fit md:px-2 md:py-1 md:rounded-2xl`}
    >
      <div className="w-full flex justify-center md:justify-start md:px-3 md:py-1">
        <button
          title="Home - Upload/Record New"
          onClick={resetApp}
          className="text-light-blue-light text-gray-100 hover:text-gray-400 active:scale-125 border-2 inline-flex items-center mr-4 p-2 border-transparent bg-light-secondary focus:outline-none rounded-full text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
        </button>
        <button
          title={isAudioMuted ? "Unmute Music" : "Mute Music"}
          onClick={toggleAudioMute}
          className="text-light-blue-light text-gray-100 hover:text-gray-400 active:scale-125 border-2 inline-flex items-center mr-4 p-2 border-transparent bg-light-secondary focus:outline-none rounded-full text-sm"
        >
          {isAudioMuted ? <MdMusicOff className="h-6 w-6" /> : <MdMusicNote className="h-6 w-6" />}
        </button>
        <button
          title="GitHub Repo"
          onClick={() =>
            window.open("https://github.com/AsafMeizner/muse-music-sentiment-detection", "_blank")
          }
          className="text-light-blue-light text-gray-100 hover:text-gray-400 active:scale-125 border-2 inline-flex items-center mr-4 p-2 border-transparent bg-light-secondary focus:outline-none rounded-full text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.725-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.835 2.807 1.305 3.492.997.108-.775.418-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.47-2.38 1.235-3.22-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23a11.49 11.49 0 013.003-.404c1.02.005 2.045.137 3.003.404 2.29-1.552 3.296-1.23 3.296-1.23.654 1.653.243 2.873.12 3.176.77.84 1.233 1.91 1.233 3.22 0 4.61-2.803 5.625-5.475 5.922.43.37.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 21.797 24 17.303 24 12 24 5.373 18.627 0 12 0z" />
          </svg>
        </button>
        <button
          title="Open Project Paper"
          onClick={() =>
            window.open("https://github.com/AsafMeizner/muse-music-sentiment-detection", "_blank")
          }
          className="text-light-blue-light text-gray-100 hover:text-gray-400 active:scale-125 border-2 inline-flex items-center mr-4 p-2 border-transparent bg-light-secondary focus:outline-none rounded-full text-sm"
        >
          <FaBook className="h-5 w-6" />
        </button>
      </div>
    </div>
  );
};

export default TopMenu;
