'use server';
import axios from 'axios';

const apiUrlGlobal = 'https://musicserver.meizner.live/analyze';
const apiUrlLocal = 'http://localhost:8000/analyze';
const apiUrl = process.env.NODE_ENV === 'production' ? apiUrlGlobal : apiUrlLocal;

export async function analyzeAudio(formData: FormData): Promise<{
  segments: {
    timeSec: number;
    valence: number;
    arousal: number;
    dominance: number;
  }[];
  genre: string;
}> {
  const response = await axios.post(apiUrl, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  if (response.status !== 200) {
    throw new Error(`API request failed with status code ${response.status}`);
  }
  return response.data;
}
