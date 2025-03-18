import React from "react";
import { FaMusic, FaMicrophoneSlash, FaDrum, FaHeadphones, FaGuitar, FaMicrophone } from "react-icons/fa";
import { GiViolin, GiSaxophone } from "react-icons/gi";

interface GenreAndSeedsProps {
  genre?: string | null;
}

const genreIconMap: Record<string, React.ElementType> = {
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

const seeds = [
  { label: "Happy", icon: FaMusic, color: "text-yellow-500" },
  { label: "Sad", icon: FaMicrophoneSlash, color: "text-blue-500" },
  { label: "Excited", icon: FaDrum, color: "text-red-500" },
  { label: "Calm", icon: FaHeadphones, color: "text-green-500" },
];

const GenreAndSeeds: React.FC<GenreAndSeedsProps> = ({ genre }) => {
  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex-1 bg-white rounded-lg shadow p-6 flex flex-col items-center transition-transform duration-500 hover:scale-105">
        <h3 className="text-xl font-semibold mb-2">Predicted Genre</h3>
        {genre ? (
          <div className="flex items-center space-x-3">
            {React.createElement(genreIconMap[genre] || FaMusic, { className: "text-3xl text-indigo-600" })}
            <span className="text-2xl font-medium">{genre}</span>
          </div>
        ) : (
          <span className="text-gray-500">No genre predicted</span>
        )}
      </div>
      <div className="flex-1 bg-white rounded-lg shadow p-6 flex flex-col items-center transition-transform duration-500 hover:scale-105">
        <h3 className="text-xl font-semibold mb-2 text-center">Seeds</h3>
        <div className="flex flex-wrap justify-center gap-2">
          {seeds.map((seed) => (
            <div key={seed.label} className="flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full">
              {React.createElement(seed.icon, { className: `text-2xl ${seed.color}` })}
              <span className="font-medium text-lg text-center">{seed.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GenreAndSeeds;
