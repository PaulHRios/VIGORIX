// src/utils/pdfExport.js
import { jsPDF } from 'jspdf';
import { translations } from '../data/translations.js';
import { CONDITIONS } from '../data/conditions.js';
import { localizeSubgroup } from '../data/subgroupClassifier.js';

/**
 * Top-level entry. Decides whether to render a single-day or weekly PDF.
 */
export function exportRoutinePdf(routine, lang = 'en', routineName) {
  if (routine?.type === 'weekly') {
    return exportWeeklyRoutinePdf(routine, lang, routineName);
  }
  return exportSingleRoutinePdf(routine, lang, routineName);
}

/**
 * Single-day routine PDF.
 */
export function exportSingleRoutinePdf(routine, lang = 'en', routineName) {
  const t = translations[lang] || translations.en;
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  let y = margin;

  drawHeader(doc, pageW, lang, routine.createdAt);
  y = 130;

  doc.setTextColor(20, 20, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(routineName || t.saved.defaultName, margin, y);
  y += 12;

  drawRequestSummary(doc, routine.request, t, lang, margin, y, pageW);
  y += 30;

  if (routine.conditionKeys?.length) {
    y = drawConditionWarning(doc, routine.conditionKeys, t, lang, margin, y, pageW);
  }

  y = drawExerciseList(doc, routine.exercises || [], t, lang, margin, y, pageW, pageH);

  drawFooter(doc, t, margin, pageW, pageH, y);

  saveDoc(doc, routineName || 'routine');
}

/**
 * Multi-day weekly plan PDF — one page section per training day.
 */
export function exportWeeklyRoutinePdf(weekly, lang = 'en', routineName) {
  const t = translations[lang] || translations.en;
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  let y = margin;

  drawHeader(doc, pageW, lang, weekly.createdAt);
  y = 130;

  doc.setTextColor(20, 20, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(routineName || t.weekly.title, margin, y);
  y += 28;

  // Plan summary
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  const summary = [
    `${t.common.days}: ${weekly.daysPerWeek}`,
    `${t.form.goal}: ${t.onboarding?.goals?.[weekly.request?.goal] || weekly.request?.goal || ''}`,
    `${t.form.level}: ${t.onboarding?.levels?.[weekly.request?.level] || weekly.request?.level || ''}`,
  ].join('   •   ');
  doc.text(summary, margin, y, { maxWidth: pageW - margin * 2 });
  y += 20;

  if (weekly.conditionKeys?.length) {
    y = drawConditionWarning(doc, weekly.conditionKeys, t, lang, margin, y, pageW);
  }

  weekly.days.forEach((day, dayIndex) => {
    if (y > pageH - 200) {
      doc.addPage();
      y = margin;
    }

    // Day header bar
    doc.setFillColor(31, 232, 122);
    doc.roundedRect(margin, y, pageW - margin * 2, 28, 6, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(5, 7, 7);
    const dayLabel = day.label?.[lang] || day.label?.en || `Day ${dayIndex + 1}`;
    doc.text(`${t.weekly.day} ${dayIndex + 1}  —  ${dayLabel}`, margin + 12, y + 19);
    y += 38;

    if (!day.routine || day.routine.empty || !day.routine.exercises?.length) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(11);
      doc.setTextColor(120, 120, 120);
      doc.text(t.weekly.rest, margin + 12, y + 12);
      y += 32;
      return;
    }

    y = drawExerciseList(doc, day.routine.exercises, t, lang, margin, y, pageW, pageH);
  });

  drawFooter(doc, t, margin, pageW, pageH, y);
  saveDoc(doc, routineName || 'weekly-plan');
}

// ============================================================
// HELPERS
// ============================================================

function drawHeader(doc, pageW, lang, createdAt) {
  const margin = 48;
  doc.setFillColor(5, 7, 7);
  doc.rect(0, 0, pageW, 90, 'F');
  doc.setTextColor(31, 232, 122);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('VIGORIX', margin, 56);
  doc.setTextColor(180, 180, 180);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const dateStr = new Date(createdAt || Date.now()).toLocaleDateString(
    lang === 'es' ? 'es-ES' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' },
  );
  doc.text(dateStr, pageW - margin, 56, { align: 'right' });
}

function drawRequestSummary(doc, request, t, lang, margin, y, pageW) {
  if (!request) return;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const parts = [];
  if (request.goal) parts.push(`${t.form.goal}: ${t.onboarding?.goals?.[request.goal] || request.goal}`);
  if (request.muscle) parts.push(`${t.form.muscle}: ${t.form.muscleOptions?.[request.muscle] || request.muscle}`);
  if (request.equipment) {
    const lbl = Array.isArray(request.equipment)
      ? request.equipment.map((e) => t.form.equipmentOptions?.[e] || e).join(', ')
      : t.form.equipmentOptions?.[request.equipment] || request.equipment;
    parts.push(`${t.form.equipment}: ${lbl}`);
  }
  if (request.time) parts.push(`${t.form.time}: ${request.time} ${t.common.minutes}`);
  if (request.level) parts.push(`${t.form.level}: ${t.onboarding?.levels?.[request.level] || request.level}`);
  doc.text(parts.join('   •   '), margin, y + 12, { maxWidth: pageW - margin * 2 });
}

function drawConditionWarning(doc, conditionKeys, t, lang, margin, y, pageW) {
  const labels = conditionKeys.map((k) => CONDITIONS[k]?.label[lang] || k).join(', ');
  doc.setFillColor(255, 235, 200);
  doc.setDrawColor(245, 165, 36);
  doc.roundedRect(margin, y, pageW - margin * 2, 56, 6, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(120, 70, 0);
  doc.text(`! ${t.safety.bannerTitle} - ${labels}`, margin + 12, y + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const wrapped = doc.splitTextToSize(t.safety.bannerBody, pageW - margin * 2 - 24);
  doc.text(wrapped, margin + 12, y + 36);
  return y + 72;
}

function drawExerciseList(doc, exercises, t, lang, margin, startY, pageW, pageH) {
  let y = startY;
  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    if (y > pageH - 140) {
      doc.addPage();
      y = margin;
    }

    const cardH = 88;
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(margin, y, pageW - margin * 2, cardH, 8, 8, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(20, 20, 20);
    const exName = ex.name?.[lang] || ex.name?.en || ex.id;
    doc.text(`${i + 1}. ${exName}`, margin + 14, y + 20);

    // Muscle metadata line
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    const muscleParts = [];
    if (ex.main_muscle) muscleParts.push(t.exercise.primaryMuscle + ': ' + (localizeSubgroup(ex.main_muscle, lang) || ex.main_muscle));
    if (ex.sub_muscle && ex.sub_muscle !== ex.main_muscle) muscleParts.push(t.exercise.subgroup + ': ' + localizeSubgroup(ex.sub_muscle, lang));
    if (ex.equipment) muscleParts.push((t.form?.equipment || 'Equipment') + ': ' + (t.form?.equipmentOptions?.[ex.equipment] || ex.equipment));
    if (ex.technique && ex.technique !== 'straight') {
      muscleParts.push((t.exercise?.technique || 'Technique') + ': ' + (t.exercise?.techniques?.[ex.technique] || ex.technique));
    }
    doc.text(muscleParts.join('   •   '), margin + 14, y + 36, { maxWidth: pageW - margin * 2 - 28 });

    // Prescription line
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    const meta = `${ex.sets || 3} ${t.common.sets}  ·  ${ex.reps || '8-12'} ${t.common.reps}  ·  ${ex.rest || 60}${t.common.seconds} ${t.common.rest}`;
    doc.text(meta, margin + 14, y + 56);

    // First instruction step
    const firstInstr = ex.instructions?.[lang]?.[0] || ex.instructions?.en?.[0] || null;
    if (firstInstr) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      const wrapped = doc.splitTextToSize(firstInstr, pageW - margin * 2 - 28);
      doc.text(wrapped.slice(0, 2), margin + 14, y + 72);
    }

    y += cardH + 10;
  }
  return y;
}

function drawFooter(doc, t, margin, pageW, pageH, y) {
  if (y > pageH - 100) {
    doc.addPage();
    y = margin;
  }
  y = Math.max(y, pageH - 110);
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageW - margin, y);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  const disclaimer = doc.splitTextToSize(t.disclaimer.body, pageW - margin * 2);
  doc.text(disclaimer, margin, y + 16);
}

function saveDoc(doc, routineName) {
  const safe = (routineName || 'routine').replace(/[^\w\s-]/g, '').trim() || 'routine';
  const filename = `vigorix-${safe.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;
  doc.save(filename);
}
