// src/utils/cooldown.js
//
// Picks 4–5 cooldown / mobility moves based on the muscles trained.
// Returns localized labels with a YouTube fallback for each.

import { youtubeSearchUrl } from './workoutGenerator.js';

const COOLDOWNS = {
  chest: [
    { en: 'Doorway pec stretch', es: 'Estiramiento de pecho en marco de puerta', seconds: 45 },
    { en: 'Foam roll thoracic spine', es: 'Foam roller en columna dorsal', seconds: 60 },
  ],
  back: [
    { en: 'Cat–cow', es: 'Gato–vaca', seconds: 60 },
    { en: 'Child\'s pose', es: 'Postura del niño', seconds: 60 },
    { en: 'Seated forward fold', es: 'Pinza sentado', seconds: 45 },
  ],
  shoulders: [
    { en: 'Cross-body shoulder stretch', es: 'Estiramiento cruzado de hombro', seconds: 30 },
    { en: 'Sleeper stretch', es: 'Sleeper stretch (rotador interno)', seconds: 45 },
  ],
  biceps: [
    { en: 'Wall biceps stretch', es: 'Estiramiento de bíceps en pared', seconds: 30 },
  ],
  triceps: [
    { en: 'Overhead triceps stretch', es: 'Estiramiento de tríceps por encima de la cabeza', seconds: 30 },
  ],
  quads: [
    { en: 'Standing quad stretch', es: 'Estiramiento de cuádriceps de pie', seconds: 45 },
    { en: 'Couch stretch', es: 'Couch stretch', seconds: 60 },
  ],
  hamstrings: [
    { en: 'Hamstring strap stretch', es: 'Estiramiento de isquios con cinta', seconds: 45 },
    { en: 'Standing toe touch', es: 'Tocar las puntas de pie', seconds: 30 },
  ],
  glutes: [
    { en: 'Pigeon pose', es: 'Postura de la paloma', seconds: 60 },
    { en: '90/90 hip rotation', es: 'Rotación de cadera 90/90', seconds: 45 },
  ],
  calves: [
    { en: 'Wall calf stretch', es: 'Estiramiento de pantorrilla en pared', seconds: 45 },
  ],
  abs: [
    { en: 'Cobra stretch', es: 'Postura de la cobra', seconds: 30 },
  ],
  traps: [
    { en: 'Neck side stretch', es: 'Estiramiento lateral de cuello', seconds: 30 },
  ],
  full_body: [
    { en: 'Standing forward fold', es: 'Flexión de pie', seconds: 45 },
    { en: 'World\'s greatest stretch', es: 'World\'s greatest stretch', seconds: 60 },
    { en: 'Box breathing 4-4-4-4', es: 'Respiración cuadrada 4-4-4-4', seconds: 90 },
  ],
};

/**
 * Build a cooldown sequence for a routine. Looks at every exercise's
 * main_muscle, picks one stretch per group, caps at 5 moves, and always
 * appends a deep-breathing finisher.
 */
export function buildCooldown(exercises, lang = 'en') {
  const seen = new Set();
  const groups = [];
  for (const ex of exercises || []) {
    const m = ex.main_muscle || ex._targetMuscle || ex.muscle;
    if (!m || seen.has(m)) continue;
    seen.add(m);
    groups.push(m);
  }
  if (groups.length === 0) groups.push('full_body');

  const moves = [];
  for (const g of groups) {
    const list = COOLDOWNS[g] || COOLDOWNS.full_body;
    if (!list) continue;
    moves.push(list[0]); // pick the canonical stretch for that group
    if (moves.length >= 4) break;
  }
  // Always finish with a breathing move.
  moves.push(COOLDOWNS.full_body[2]);

  return moves.map((m) => ({
    name: m[lang] || m.en,
    seconds: m.seconds,
    youtube: youtubeSearchUrl(m.en, lang),
  }));
}
