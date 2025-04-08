import React from "react";
import { FaMusic, FaMicrophoneSlash, FaDrum, FaHeadphones, FaGuitar, FaMicrophone } from "react-icons/fa";
import { GiViolin, GiSaxophone } from "react-icons/gi";

interface GenreAndSeedsProps {
  genre?: {
    predicted_genre: string;
    confidence: number;
    top_genres: { genre: string; confidence: number }[];
  } | null;
  emotions?: {
    top_emotion: { code: string; name: string; distance: number };
    top_emotions: { code: string; name: string; distance: number }[];
  } | null;
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

const GenreAndSeeds: React.FC<GenreAndSeedsProps> = ({ genre, emotions }) => {
  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex-1 bg-white rounded-lg shadow p-6 flex flex-col items-center transition-transform duration-500 hover:scale-105">
        <h3 className="text-xl font-semibold mb-2">Predicted Genre</h3>
        {genre ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="flex items-center space-x-3">
              {React.createElement(genreIconMap[genre.predicted_genre] || FaMusic, { className: "text-3xl text-indigo-600" })}
              <span className="text-2xl font-medium capitalize">{genre.predicted_genre}</span>
            </div>
            <div className="text-sm text-gray-600">
              Confidence: {(genre.confidence * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Other possible genres:
              <div className="flex flex-wrap justify-center gap-2 mt-1">
                {genre.top_genres.slice(1, 4).map((g) => (
                  <span key={g.genre} className="bg-gray-100 px-2 py-1 rounded">
                    {g.genre} ({(g.confidence * 100).toFixed(1)}%)
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-gray-500">No genre predicted</span>
        )}
      </div>
      <div className="flex-1 bg-white rounded-lg shadow p-6 flex flex-col items-center transition-transform duration-500 hover:scale-105">
        <h3 className="text-xl font-semibold mb-2 text-center">Emotions</h3>
        {emotions ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="text-center">
              <div className="text-lg font-medium capitalize">{emotions.top_emotion.name}</div>
              <div className="text-sm text-gray-600">Distance: {emotions.top_emotion.distance.toFixed(2)}</div>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {emotions.top_emotions.map((emotion) => (
                <div
                  key={emotion.code}
                  className="flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full"
                >
                  <span className="font-medium text-lg text-center capitalize">{emotion.name}</span>
                  <span className="text-sm text-gray-500">({emotion.distance.toFixed(2)})</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <span className="text-gray-500">No emotions detected</span>
        )}
      </div>
    </div>
  );
};

export default GenreAndSeeds;
