// Unified storage layer. If Supabase is configured AND the user is signed in,
// reads/writes go to Supabase. Otherwise everything stays in localStorage.
// All callers use this module — they never touch localStorage / supabase directly.

import { supabase, isSupabaseEnabled } from './supabase.js';

const KEYS = {
  routines: 'gymai.routines.v1',
  logs: 'gymai.logs.v1',
  body: 'gymai.bodyweight.v1',
  disclaimer: 'gymai.disclaimer.v1',
  language: 'gymai.lang.v1',
};

export const storageKeys = KEYS;

// ---------- localStorage helpers ----------
function lsGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

// ---------- Auth state passed in by callers ----------
async function currentUser() {
  if (!isSupabaseEnabled) return null;
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

// ============================================================
// SAVED ROUTINES
// ============================================================
export async function listRoutines() {
  const user = await currentUser();
  if (user) {
    const { data, error } = await supabase
      .from('saved_routines')
      .select('id, name, payload, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((r) => ({
      id: r.id,
      name: r.name,
      routine: r.payload,
      createdAt: r.created_at,
    }));
  }
  return lsGet(KEYS.routines, []);
}

export async function saveRoutine(name, routine) {
  const user = await currentUser();
  if (user) {
    const { data, error } = await supabase
      .from('saved_routines')
      .insert({ user_id: user.id, name, payload: routine })
      .select()
      .single();
    if (error) throw error;
    return { id: data.id, name: data.name, routine: data.payload, createdAt: data.created_at };
  }
  const list = lsGet(KEYS.routines, []);
  const item = {
    id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    routine,
    createdAt: new Date().toISOString(),
  };
  list.unshift(item);
  lsSet(KEYS.routines, list);
  return item;
}

export async function deleteRoutine(id) {
  const user = await currentUser();
  if (user && !String(id).startsWith('local_')) {
    const { error } = await supabase.from('saved_routines').delete().eq('id', id);
    if (error) throw error;
    return;
  }
  const list = lsGet(KEYS.routines, []).filter((r) => r.id !== id);
  lsSet(KEYS.routines, list);
}

// ============================================================
// WORKOUT LOGS (per-set logs)
// ============================================================
export async function listLogs(limit = 50) {
  const user = await currentUser();
  if (user) {
    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }
  const all = lsGet(KEYS.logs, []);
  return all.slice(0, limit);
}

export async function addLog(entry) {
  // entry: { exercise_id, exercise_name, weight, reps, notes, set_index }
  const user = await currentUser();
  const record = {
    ...entry,
    logged_at: new Date().toISOString(),
  };
  if (user) {
    const { data, error } = await supabase
      .from('workout_logs')
      .insert({ user_id: user.id, ...record })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const list = lsGet(KEYS.logs, []);
  const local = { id: `local_${Date.now()}`, ...record };
  list.unshift(local);
  lsSet(KEYS.logs, list.slice(0, 500));
  return local;
}

// ============================================================
// BODY METRICS (body weight)
// ============================================================
export async function listBodyMetrics(limit = 60) {
  const user = await currentUser();
  if (user) {
    const { data, error } = await supabase
      .from('body_metrics')
      .select('*')
      .eq('user_id', user.id)
      .order('measured_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }
  return lsGet(KEYS.body, []).slice(0, limit);
}

export async function addBodyMetric({ weight, unit }) {
  const user = await currentUser();
  const record = {
    weight: Number(weight),
    unit: unit || 'kg',
    measured_at: new Date().toISOString(),
  };
  if (user) {
    const { data, error } = await supabase
      .from('body_metrics')
      .insert({ user_id: user.id, ...record })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const list = lsGet(KEYS.body, []);
  const local = { id: `local_${Date.now()}`, ...record };
  list.unshift(local);
  lsSet(KEYS.body, list.slice(0, 500));
  return local;
}

// ============================================================
// PREFERENCES (always local — fast)
// ============================================================
export function getDisclaimerAccepted() {
  return lsGet(KEYS.disclaimer, false);
}
export function setDisclaimerAccepted(v) {
  lsSet(KEYS.disclaimer, !!v);
}

export function getLanguage() {
  return lsGet(KEYS.language, null);
}
export function setLanguage(lang) {
  lsSet(KEYS.language, lang);
}

// ============================================================
// EXPORT / IMPORT — JSON dump of local data (for offline users)
// ============================================================
export function exportLocalData() {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    routines: lsGet(KEYS.routines, []),
    logs: lsGet(KEYS.logs, []),
    body: lsGet(KEYS.body, []),
  };
}

export function importLocalData(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid payload');
  if (Array.isArray(payload.routines)) lsSet(KEYS.routines, payload.routines);
  if (Array.isArray(payload.logs)) lsSet(KEYS.logs, payload.logs);
  if (Array.isArray(payload.body)) lsSet(KEYS.body, payload.body);
}
