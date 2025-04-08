import React from "react";
import { FaMusic, FaMicrophone, FaDrum, FaHeadphones, FaGuitar } from "react-icons/fa";
import { GiViolin, GiSaxophone, GiPianoKeys, GiTrumpet, GiDrumKit, GiGuitar } from "react-icons/gi";
import { MdPiano, MdMusicNote } from "react-icons/md";
import { BsEmojiSmile, BsEmojiFrown, BsEmojiAngry, BsEmojiHeartEyes, BsEmojiLaughing, BsEmojiDizzy, BsEmojiSunglasses, BsEmojiWink, BsEmojiExpressionless, BsEmojiTear } from "react-icons/bs";

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

const genreIconMap: Record<string, { icon: React.ElementType; color: string }> = {
  blues: { icon: GiSaxophone, color: "text-blue-600" },
  classical: { icon: GiViolin, color: "text-purple-600" },
  country: { icon: FaGuitar, color: "text-green-600" },
  disco: { icon: FaHeadphones, color: "text-pink-600" },
  hiphop: { icon: FaMicrophone, color: "text-red-600" },
  jazz: { icon: GiTrumpet, color: "text-yellow-600" },
  metal: { icon: GiDrumKit, color: "text-gray-800" },
  pop: { icon: MdMusicNote, color: "text-indigo-600" },
  reggae: { icon: FaDrum, color: "text-orange-600" },
  rock: { icon: GiGuitar, color: "text-red-800" },
};

const emotionIconMap: Record<string, { icon: React.ElementType; color: string; bgColor: string; textColor: string }> = {
  H: { icon: BsEmojiHeartEyes, color: "text-pink-500", bgColor: "bg-pink-100", textColor: "text-pink-800" }, // Erotic, desirous
  J: { icon: BsEmojiLaughing, color: "text-yellow-500", bgColor: "bg-yellow-100", textColor: "text-yellow-800" }, // Joyful, cheerful
  A: { icon: BsEmojiSmile, color: "text-green-500", bgColor: "bg-green-100", textColor: "text-green-800" }, // Amusing
  G: { icon: BsEmojiSunglasses, color: "text-orange-500", bgColor: "bg-orange-100", textColor: "text-orange-800" }, // Energizing, pump-up
  I: { icon: BsEmojiAngry, color: "text-red-500", bgColor: "bg-red-100", textColor: "text-red-800" }, // Indignant, defiant
  B: { icon: BsEmojiDizzy, color: "text-gray-500", bgColor: "bg-gray-100", textColor: "text-gray-800" }, // Annoying
  L: { icon: BsEmojiExpressionless, color: "text-purple-500", bgColor: "bg-purple-100", textColor: "text-purple-800" }, // Scary, fearful
  C: { icon: BsEmojiWink, color: "text-blue-500", bgColor: "bg-blue-100", textColor: "text-blue-800" }, // Anxious, tense
  M: { icon: BsEmojiSunglasses, color: "text-indigo-500", bgColor: "bg-indigo-100", textColor: "text-indigo-800" }, // Triumphant, heroic
  F: { icon: BsEmojiWink, color: "text-teal-500", bgColor: "bg-teal-100", textColor: "text-teal-800" }, // Dreamy
  K: { icon: BsEmojiTear, color: "text-gray-400", bgColor: "bg-gray-100", textColor: "text-gray-700" }, // Sad, depressing
};

const GenreAndSeeds: React.FC<GenreAndSeedsProps> = ({ genre, emotions }) => {
  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex-1 bg-white rounded-lg shadow p-6 flex flex-col items-center transition-transform duration-500 hover:scale-105">
        <h3 className="text-xl font-semibold mb-2">Predicted Genre</h3>
        {genre ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="flex items-center space-x-3">
              {React.createElement(
                genreIconMap[genre.predicted_genre]?.icon || FaMusic,
                { className: `text-3xl ${genreIconMap[genre.predicted_genre]?.color || "text-indigo-600"}` }
              )}
              <span className="text-2xl font-medium capitalize">{genre.predicted_genre}</span>
            </div>
            <div className="text-sm text-gray-600">
              Confidence: {(genre.confidence * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Other possible genres:
              <div className="flex flex-wrap justify-center gap-2 mt-1">
                {genre.top_genres.slice(1, 4).map((g) => (
                  <span key={g.genre} className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded">
                    {React.createElement(
                      genreIconMap[g.genre]?.icon || FaMusic,
                      { className: `text-lg ${genreIconMap[g.genre]?.color || "text-indigo-600"}` }
                    )}
                    <span>{g.genre} ({(g.confidence * 100).toFixed(1)}%)</span>
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
            <div className={`text-center p-4 rounded-lg ${emotionIconMap[emotions.top_emotion.code]?.bgColor || "bg-gray-100"} w-full`}>
              <div className="flex items-center justify-center space-x-2">
                {React.createElement(
                  emotionIconMap[emotions.top_emotion.code]?.icon || BsEmojiSmile,
                  { className: `text-3xl ${emotionIconMap[emotions.top_emotion.code]?.color || "text-gray-500"}` }
                )}
                <div className={`text-lg font-medium capitalize ${emotionIconMap[emotions.top_emotion.code]?.textColor || "text-gray-800"}`}>
                  {emotions.top_emotion.name}
                </div>
              </div>
              <div className={`text-sm ${emotionIconMap[emotions.top_emotion.code]?.textColor || "text-gray-600"}`}>
                Distance: {emotions.top_emotion.distance.toFixed(2)}
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {emotions.top_emotions.map((emotion) => (
                <div
                  key={emotion.code}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-full ${emotionIconMap[emotion.code]?.bgColor || "bg-gray-100"} hover:opacity-80 transition-opacity`}
                >
                  {React.createElement(
                    emotionIconMap[emotion.code]?.icon || BsEmojiSmile,
                    { className: `text-xl ${emotionIconMap[emotion.code]?.color || "text-gray-500"}` }
                  )}
                  <span className={`font-medium text-lg text-center capitalize ${emotionIconMap[emotion.code]?.textColor || "text-gray-800"}`}>
                    {emotion.name}
                  </span>
                  <span className={`text-sm ${emotionIconMap[emotion.code]?.textColor || "text-gray-600"}`}>
                    ({emotion.distance.toFixed(2)})
                  </span>
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
