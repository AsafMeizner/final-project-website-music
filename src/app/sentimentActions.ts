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
  // Get the audio file from the formData
  const audioFile = formData.get("audio");
  if (!audioFile || !(audioFile instanceof Blob)) {
    throw new Error("Audio file not provided or invalid.");
  }

  // Create a new FormData object for the API request
  const apiFormData = new FormData();
  apiFormData.append("file", audioFile);

  // Send the request to the API
  const response = await fetch("http://localhost:8000/analysis/combined", {
    method: "POST",
    body: apiFormData,
  });

  if (!response.ok) {
    throw new Error("Failed to analyze audio");
  }

  const data = await response.json();

  // Transform the API response into the format expected by the frontend
  const segments = data.sentiment.segment_analysis.map((segment: any) => ({
    timeSec: segment.time_range.start,
    valence: segment.scaled_prediction.valence,
    arousal: segment.scaled_prediction.arousal,
  }));

  return {
    segments,
    genre: data.genre,
    emotions: data.sentiment.emotions,
  };
}
