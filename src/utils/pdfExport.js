// src/utils/pdfExport.js
import { jsPDF } from 'jspdf';
import { translations } from '../data/translations.js';
import { CONDITIONS } from '../data/conditions.js';

/**
 * Build and download a PDF for a routine.
 *
 * @param {object} routine     The routine returned by generateRoutine().
 * @param {string} lang        'en' | 'es'
 * @param {string} routineName User-chosen name (or default).
 */
export function exportRoutinePdf(routine, lang = 'en', routineName) {
  const t = translations[lang] || translations.en;
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  let y = margin;

  // ----- Header -----
  doc.setFillColor(5, 7, 7);
  doc.rect(0, 0, pageW, 90, 'F');

  doc.setTextColor(31, 232, 122);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('VIGORIX', margin, 56);

  doc.setTextColor(180, 180, 180);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const dateStr = new Date(routine.createdAt || Date.now()).toLocaleDateString(
    lang === 'es' ? 'es-ES' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' },
  );
  doc.text(dateStr, pageW - margin, 56, { align: 'right' });

  y = 130;

  // ----- Routine title -----
  doc.setTextColor(20, 20, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(routineName || t.saved.defaultName, margin, y);
  y += 12;

  // ----- Request summary -----
  if (routine.request) {
    const r = routine.request;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const parts = [];
    if (r.goal) parts.push(`${t.form.goal}: ${t.onboarding?.goals?.[r.goal] || r.goal}`);
    if (r.muscle) parts.push(`${t.form.muscle}: ${t.form.muscleOptions?.[r.muscle] || r.muscle}`);
    if (r.equipment) {
      const equipmentLabel = Array.isArray(r.equipment)
        ? r.equipment.map((e) => t.form.equipmentOptions?.[e] || e).join(', ')
        : t.form.equipmentOptions?.[r.equipment] || r.equipment;
      parts.push(`${t.form.equipment}: ${equipmentLabel}`);
    }
    if (r.time) parts.push(`${t.form.time}: ${r.time} ${t.common.minutes}`);
    if (r.level) parts.push(`${t.form.level}: ${t.onboarding?.levels?.[r.level] || r.level}`);
    const line = parts.join('   •   ');
    doc.text(line, margin, y + 12, { maxWidth: pageW - margin * 2 });
    y += 30;
  }

  // ----- Condition warning -----
  if (routine.conditionKeys && routine.conditionKeys.length > 0) {
    const labels = routine.conditionKeys
      .map((k) => CONDITIONS[k]?.label[lang] || k)
      .join(', ');
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
    y += 72;
  }

  // ----- Exercises table -----
  doc.setDrawColor(220, 220, 220);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);

  for (let i = 0; i < routine.exercises.length; i++) {
    const ex = routine.exercises[i];
    if (y > pageH - 140) {
      doc.addPage();
      y = margin;
    }

    const cardH = 78;
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(margin, y, pageW - margin * 2, cardH, 8, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(20, 20, 20);
    const exName = ex.name?.[lang] || ex.name?.en || ex.id;
    doc.text(`${i + 1}. ${exName}`, margin + 14, y + 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    const meta = `${ex.sets} ${t.common.sets}  ·  ${ex.reps} ${t.common.reps}  ·  ${ex.rest}${t.common.seconds} ${t.common.rest}`;
    doc.text(meta, margin + 14, y + 42);

    const firstInstr =
      ex.instructions?.[lang]?.[0] || ex.instructions?.en?.[0] || null;
    if (firstInstr) {
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      const firstStep = doc.splitTextToSize(firstInstr, pageW - margin * 2 - 28);
      doc.text(firstStep, margin + 14, y + 60);
    }

    y += cardH + 12;
  }

  // ----- Disclaimer footer (always last) -----
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

  // ----- Save -----
  const safeName = (routineName || 'routine').replace(/[^\w\s-]/g, '').trim() || 'routine';
  const filename = `vigorix-${safeName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;
  doc.save(filename);
}
