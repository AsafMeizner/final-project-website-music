'use server';

export async function analyzeAudio(formData: FormData): Promise<{
  segments: {
    timeSec: number;
    valence: number;
    arousal: number;
  }[];
  genre: {
    predicted_genre: string;
    confidence: number;
    top_genres: { genre: string; confidence: number }[];
  };
  emotions: {
    top_emotion: { code: string; name: string; distance: number };
    top_emotions: { code: string; name: string; distance: number }[];
  };
}> {
  const audioFile = formData.get("audio");
  if (!audioFile || !(audioFile instanceof Blob)) {
    throw new Error("Audio file not provided or invalid.");
  }

  const apiFormData = new FormData();
  apiFormData.append("file", audioFile);

  const response = await fetch("http://localhost:8000/analysis/combined", {
    method: "POST",
    body: apiFormData,
  });

  if (!response.ok) {
    throw new Error("Failed to analyze audio");
  }

  const data = await response.json();

  // Transform the API response into the format expected by the frontend
  const segments = data.sentiment.segments.map((segment: any) => ({
    timeSec: segment.time_range.start,
    valence: segment.valence,
    arousal: segment.arousal,
  }));

  return {
    segments,
    genre: data.genre,
    emotions: data.sentiment.emotions,
  };
}