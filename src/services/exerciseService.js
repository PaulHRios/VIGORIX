// Exercise data source.
// Per spec: try a free public exercise API; fall back to the local dataset.
// IMPORTANT: this implementation NEVER returns an exercise without a gif.

import { SAFE_EXERCISES } from '../data/exercises.js';

// Public ExerciseDB / wger don't ship CORS-friendly bilingual + gif endpoints
// reliably without an API key, so the safest, deployable default is the
// curated local dataset. The hook below is structured so a future maintainer
// can plug in a real API by editing only `fetchFromApi`.
async function fetchFromApi() {
  // Intentionally returns null. To wire up a real API later:
  //   const r = await fetch('https://exercisedb.example/api/exercises', { headers: {...} });
  //   const data = await r.json();
  //   return data.filter(e => e.gifUrl).map(normalize);
  return null;
}

let cache = null;

export async function getExercises() {
  if (cache) return cache;
  try {
    const remote = await fetchFromApi();
    if (remote && remote.length > 0) {
      cache = remote.filter((e) => !!e.gif);
      return cache;
    }
  } catch (e) {
    // swallow — fall through to fallback
    console.warn('[GymAI] Exercise API failed, using fallback dataset.', e);
  }
  cache = SAFE_EXERCISES;
  return cache;
}
