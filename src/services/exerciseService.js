// src/services/exerciseService.js
//
// Thin facade over the aggregator. Keeps the existing public API
// (getExercises, reloadExercises) so the rest of the app didn't have to change.

import { aggregateExercises, reload, getCacheInfo, clearCache } from './exerciseAggregator.js';

export async function getExercises() {
  return aggregateExercises();
}

export async function reloadExercises() {
  return reload();
}

export function getDatabaseInfo() {
  return getCacheInfo();
}

export function purgeDatabase() {
  clearCache();
}
