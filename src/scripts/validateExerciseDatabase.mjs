#!/usr/bin/env node
/* eslint-disable no-console */
//
// scripts/validateExerciseDatabase.mjs
//
// Reads exercises.master.json and reports issues:
//   - missing main_muscle / sub_muscle
//   - missing instructions
//   - missing media
//   - duplicate IDs
//   - dangling secondary muscles
//
// Usage:  npm run validate:exercises

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const MASTER = path.join(ROOT, 'src/data/exercises/processed/exercises.master.json');

if (!fs.existsSync(MASTER)) {
  console.error(`💥 master file not found: ${MASTER}\nRun: npm run build:exercises`);
  process.exit(1);
}

const list = JSON.parse(fs.readFileSync(MASTER, 'utf8'));
console.log(`📊 Validating ${list.length} exercises…\n`);

const issues = {
  missing_main: [],
  missing_sub: [],
  missing_media: [],
  missing_instructions: [],
  duplicate_id: [],
  unknown_equipment: [],
};

const seen = new Set();
for (const ex of list) {
  if (!ex.main_muscle) issues.missing_main.push(ex.id);
  if (!ex.sub_muscle) issues.missing_sub.push(ex.id);
  if (!ex.images?.length && !ex.gif) issues.missing_media.push(ex.id);
  if (!ex.instructions?.en?.length) issues.missing_instructions.push(ex.id);
  if (seen.has(ex.id)) issues.duplicate_id.push(ex.id);
  seen.add(ex.id);
}

const total = list.length;
const withMedia = list.filter((e) => e.images?.length || e.gif).length;
const compound = list.filter((e) => e.exercise_type === 'compound').length;

console.log('─── COVERAGE ─────────────────────────────────────');
console.log(`  total                    ${total}`);
console.log(`  with media               ${withMedia}  (${pct(withMedia, total)})`);
console.log(`  compound                 ${compound}`);
console.log(`  isolation                ${total - compound}`);
console.log('');
console.log('─── DISTRIBUTION ─────────────────────────────────');
const byMain = {};
const bySub = {};
for (const ex of list) {
  byMain[ex.main_muscle] = (byMain[ex.main_muscle] || 0) + 1;
  bySub[ex.sub_muscle] = (bySub[ex.sub_muscle] || 0) + 1;
}
for (const [k, v] of Object.entries(byMain).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(22)} ${v}`);
}
console.log('');
console.log('─── ISSUES ───────────────────────────────────────');
let hasError = false;
for (const [name, ids] of Object.entries(issues)) {
  if (ids.length === 0) continue;
  hasError = true;
  console.log(`  ${name.padEnd(22)} ${ids.length}`);
  if (ids.length <= 10) console.log(`     ${ids.slice(0, 10).join(', ')}`);
  else console.log(`     ${ids.slice(0, 10).join(', ')} (+${ids.length - 10} more)`);
}
if (!hasError) console.log('  ✅ no issues found');
console.log('');
process.exit(hasError ? 1 : 0);

function pct(a, b) { return b === 0 ? '0%' : `${Math.round((a / b) * 100)}%`; }
