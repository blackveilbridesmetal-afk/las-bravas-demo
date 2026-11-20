import type {
  AppStatePayload,
  Candidate,
  CandidateDecision,
  CandidateMetricReport,
  JobBoardChannel,
  JobNeed,
  PsychAptitudeLevel,
  PsychEvaluation,
  PsychTestScores,
  RecruitmentCriterion,
  RecruitmentKPIs,
} from '../types';

export function getTodayYYYYMMDD(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getCurrentHHMM(now: Date = new Date()): string {
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

/**
 * Computes weighted psychological score, aptitude level, and AI table observation
 * from automated psychometric test metrics.
 */
export function evaluatePsychometricBattery(scores: PsychTestScores): {
  averageScore: number;
  aptitudeLevel: PsychAptitudeLevel;
  aiPsychObservation: string;
} {
  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  const est = clamp(scores.estabilidadEmocional);
  const tol = clamp(scores.toleranciaFaenaAltura);
  const sec = clamp(scores.apegoSeguridadHSEC);
  const team = clamp(scores.trabajoEquipo);
  const raz = clamp(scores.razonamientoOperativo);

  const averageScore = Math.round(
    sec * 0.25 + est * 0.25 + tol * 0.2 + team * 0.15 + raz * 0.15
  );

  let aptitudeLevel: PsychAptitudeLevel = 'Requiere Entrevista';
  if (averageScore >= 78 && sec >= 75) {
    aptitudeLevel = 'Apto Recomendado';
  } else if (averageScore >= 62) {
    aptitudeLevel = 'Apto con Observación';
  }

  const dims: Array<{ label: string; value: number }> = [
    { label: 'Seguridad HSEC', value: sec },
    { label: 'Estabilidad Emocional', value: est },
    { label: 'Tolerancia Faena/Altura', value: tol },
    { label: 'Trabajo en Equipo', value: team },
    { label: 'Razonamiento Operativo', value: raz },
  ];
  const strongest = [...dims].sort((a, b) => b.value - a.value)[0];
  const lowest = [...dims].sort((a, b) => a.value - b.value)[0];

  const aiPsychObservation =
    lowest.value < 70
      ? `IA observó tabla psicométrica (${averageScore}/100 · ${aptitudeLevel}): destaca en ${strongest.label} (${strongest.value}/100); reforzar seguimiento en ${lowest.label} (${lowest.value}/100).`
      : `IA observó tabla psicométrica (${averageScore}/100 · ${aptitudeLevel}): perfil equilibrado para faena minera, liderado por ${strongest.label} (${strongest.value}/100).`;

  return { averageScore, aptitudeLevel, aiPsychObservation };
}

/**
 * Converts a 5-item automated psychological questionnaire (values 1-5) into
 * structured 0-100 psychometric scores.
 */
export function scorePsychAnswersToMetrics(answers: {
  estabilidad: number;
  tolerancia: number;
  seguridad: number;
  equipo: number;
  razonamiento: number;
}): PsychTestScores {
  const toPercent = (rating: number) =>
    Math.max(40, Math.min(98, Math.round(38 + Math.max(1, Math.min(5, rating)) * 12)));

  return {
    estabilidadEmocional: toPercent(answers.estabilidad),
    toleranciaFaenaAltura: toPercent(answers.tolerancia),
    apegoSeguridadHSEC: toPercent(answers.seguridad),
    trabajoEquipo: toPercent(answers.equipo),
    razonamientoOperativo: toPercent(answers.razonamiento),
  };
}

/**
 * Evaluates all candidate metrics (technical specs, experience years, education/career,
 * psychological results, and learned Head of HR criteria/corrections) to produce a full
 * AI score report ready for the HR Chief and Administrator.
 */
export function computeCandidateScoreReport(
  candidate: {
    fullName: string;
    age: number;
    originLocation: string;
    university: string;
    career: string;
    yearsWorked: number;
    workHistorySummary: string;
    specifications: string[];
    interviewNotes: string;
    targetRoleTitle: string;
    psychEvaluation: PsychEvaluation;
  },
  need: JobNeed | undefined,
  criteria: RecruitmentCriterion[]
): {
  metricReport: CandidateMetricReport;
  aiObservedScore: number;
  aiProposedDecision: CandidateDecision;
  aiAppliedCorrectionTitle?: string;
  aiSummary: string;
} {
  const specsHaystack = `${candidate.specifications.join(' ')} ${candidate.workHistorySummary} ${candidate.interviewNotes}`.toLowerCase();
  const needSpecText = `${need?.technicalSpecifications ?? ''} ${need?.requiredSkills ?? ''} ${need?.title ?? candidate.targetRoleTitle}`.toLowerCase();
  const needKeywords = Array.from(
    new Set(needSpecText.split(/[\s,.;:()/]+/).filter((w) => w.length >= 4))
  );

  const specMatches = needKeywords.filter((kw) => specsHaystack.includes(kw)).length;
  const specRatio = needKeywords.length > 0 ? specMatches / Math.min(8, needKeywords.length) : 0.6;
  const technicalSpecsScore = Math.max(
    48,
    Math.min(98, Math.round(54 + specRatio * 36 + Math.min(8, candidate.specifications.length * 2)))
  );

  const yearsBase =
    candidate.yearsWorked >= 10
      ? 95
      : candidate.yearsWorked >= 7
      ? 89
      : candidate.yearsWorked >= 4
      ? 80
      : candidate.yearsWorked >= 2
      ? 70
      : 56;
  const miningExperienceBonus =
    specsHaystack.includes('mina') ||
    specsHaystack.includes('planta') ||
    specsHaystack.includes('faena') ||
    specsHaystack.includes('hsec')
      ? 4
      : 0;
  const experienceScore = Math.max(45, Math.min(98, yearsBase + miningExperienceBonus));

  const eduText = `${candidate.career} ${candidate.university}`.toLowerCase();
  const eduKeywords = ['mina', 'metal', 'geolog', 'seguridad', 'indus', 'mecán', 'mecan', 'logíst', 'logist', 'tecsup', 'uni', 'unsa', 'operac', 'quím', 'quim'];
  const eduHits = eduKeywords.filter((k) => eduText.includes(k)).length;
  const educationCareerScore = Math.max(58, Math.min(96, 68 + eduHits * 7));

  const hasPsych =
    candidate.psychEvaluation.status === 'Completada' &&
    candidate.psychEvaluation.averageScore !== null;
  const psychScore = hasPsych
    ? (candidate.psychEvaluation.averageScore as number)
    : 64;

  // Apply learned criteria, prioritizing HR Chief corrections
  const orderedCriteria = [
    ...criteria.filter((c) => c.isCorrection),
    ...criteria.filter((c) => !c.isCorrection),
  ];

  const matchedCriteria: RecruitmentCriterion[] = [];
  for (const crit of orderedCriteria) {
    const critKeywords = `${crit.ruleText} ${crit.title}`
      .toLowerCase()
      .split(/[\s,.;:()/]+/)
      .filter((w) => w.length >= 4);
    const matchesCandidate = critKeywords.some(
      (kw) =>
        specsHaystack.includes(kw) ||
        eduText.includes(kw) ||
        candidate.targetRoleTitle.toLowerCase().includes(kw)
    );
    if (matchesCandidate) {
      matchedCriteria.push(crit);
    }
  }

  const correctionApplied = matchedCriteria.find((c) => c.isCorrection);
  const criteriaBonus = matchedCriteria.reduce((acc, c) => {
    if (c.isCorrection) return acc + 5;
    return acc + (c.weightLabel === 'Prioritario' ? 4 : c.weightLabel === 'Importante' ? 2 : 1);
  }, 0);

  const rawWeighted =
    technicalSpecsScore * 0.3 +
    experienceScore * 0.25 +
    educationCareerScore * 0.15 +
    psychScore * 0.3 +
    Math.min(10, criteriaBonus);
  const overallScore = Math.max(30, Math.min(98, Math.round(rawWeighted)));

  let aiProposedDecision: CandidateDecision = 'Pendiente de revisión';
  if (overallScore >= 80 && (!hasPsych || psychScore >= 72)) {
    aiProposedDecision = 'Preseleccionado';
  } else if (overallScore >= 65) {
    aiProposedDecision = 'En prueba práctica';
  }

  const fitVerdict =
    overallScore >= 85
      ? 'Idoneidad Alta para el Puesto'
      : overallScore >= 72
      ? 'Idoneidad Sólida (Apto)'
      : 'Requiere Validación Adicional';

  const psychClause = hasPsych
    ? `Prueba psicológica completada (${psychScore}/100 · ${candidate.psychEvaluation.aptitudeLevel}).`
    : 'Prueba psicológica aún pendiente (puntaje base referencial hasta envío/respuesta).';

  const aiDetailedReport = correctionApplied
    ? `Apliqué la corrección del Jefe de RR.HH. ("${correctionApplied.title}"): ${correctionApplied.ruleText}. Consolidado de métricas para ${need?.title ?? candidate.targetRoleTitle}: Técnico ${technicalSpecsScore}/100, Experiencia ${experienceScore}/100 (${candidate.yearsWorked} años), Formación ${educationCareerScore}/100, Psicológico ${psychScore}/100. ${psychClause} Propuesta lista: ${aiProposedDecision}.`
    : `Evaluación integral IA (${overallScore}/100 · ${fitVerdict}) para ${need?.title ?? candidate.targetRoleTitle}: Especificaciones técnicas ${technicalSpecsScore}/100, Trayectoria ${experienceScore}/100 (${candidate.yearsWorked} años), Formación (${candidate.career} - ${candidate.university}) ${educationCareerScore}/100. ${psychClause} Propuesta: ${aiProposedDecision}.`;

  const aiSummary = correctionApplied
    ? `Apliqué la corrección del Jefe de RR.HH. ("${correctionApplied.title}"). Índice global ${overallScore}/100 · Propuesta: ${aiProposedDecision}.`
    : `Índice global ${overallScore}/100 (Técnico ${technicalSpecsScore} · Exp ${experienceScore} · Psico ${psychScore}). Propuesta: ${aiProposedDecision}.`;

  return {
    metricReport: {
      technicalSpecsScore,
      experienceScore,
      educationCareerScore,
      psychScore,
      overallScore,
      fitVerdict,
      aiDetailedReport,
      generatedAt: `${getTodayYYYYMMDD()} ${getCurrentHHMM()}`,
    },
    aiObservedScore: overallScore,
    aiProposedDecision,
    aiAppliedCorrectionTitle: correctionApplied?.title,
    aiSummary,
  };
}

/**
 * Computes recruitment process KPIs, vacancy coverage, job board ranking, and AI agreement rate.
 */
export function computeRecruitmentKPIs(state: AppStatePayload): RecruitmentKPIs {
  const totalVacancies = state.jobNeeds.reduce((sum, n) => sum + n.vacancies, 0);
  const filledVacancies = state.jobNeeds.reduce(
    (sum, n) => sum + Math.min(n.vacancies, n.filledCount),
    0
  );
  const remainingVacancies = Math.max(0, totalVacancies - filledVacancies);
  const coveragePercent =
    totalVacancies > 0 ? Math.round((filledVacancies / totalVacancies) * 100) : 0;

  const totalCandidates = state.candidates.length;
  const preselectedOrHired = state.candidates.filter(
    (c) => c.decision === 'Preseleccionado' || c.decision === 'Contratado'
  ).length;

  const psychCompletedCount = state.candidates.filter(
    (c) => c.psychEvaluation.status === 'Completada'
  ).length;
  const psychPendingCount = totalCandidates - psychCompletedCount;

  const avgProcessDays =
    totalCandidates > 0
      ? Math.round(
          state.candidates.reduce((sum, c) => sum + c.processDaysElapsed, 0) / totalCandidates
        )
      : 0;

  const totalProposalsSent = state.jobBoards.reduce((sum, b) => sum + b.proposalsSent, 0);
  const rankedBoards = [...state.jobBoards].sort(
    (a, b) => b.candidatesReceived - a.candidatesReceived
  );
  const topBoard = rankedBoards[0];

  const reviewedCandidates = state.candidates.filter((c) => c.evaluatedBy);
  const agreedCount = reviewedCandidates.filter((c) => !c.wasAiCorrected).length;
  const aiAgreementRate =
    reviewedCandidates.length > 0
      ? Math.round((agreedCount / reviewedCandidates.length) * 100)
      : 100;

  return {
    totalVacancies,
    filledVacancies,
    remainingVacancies,
    coveragePercent,
    totalCandidates,
    preselectedOrHired,
    psychCompletedCount,
    psychPendingCount,
    avgProcessDays,
    totalProposalsSent,
    topBoardName: topBoard?.name ?? 'Sin datos',
    topBoardCandidates: topBoard?.candidatesReceived ?? 0,
    aiAgreementRate,
  };
}

function escapeCsvCell(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? '-' : String(value);
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Generates UTF-8 BOM CSV with full candidate metrics, telemetry, and psychometric scores.
 */
export function buildCandidatesTelemetryCSV(candidates: Candidate[]): string {
  const headers = [
    'Candidato',
    'Edad',
    'Procedencia',
    'Universidad / Instituto',
    'Carrera',
    'Tiempo Trabajado (Años)',
    'Especificaciones Técnicas',
    'Bolsa de Trabajo Origen',
    'Vacante Postulada',
    'Estado Prueba Psicológica',
    'Estabilidad Emocional',
    'Tolerancia Faena/Altura',
    'Seguridad HSEC',
    'Trabajo en Equipo',
    'Razonamiento Operativo',
    'Promedio Psicológico',
    'Nivel Aptitud Psicológica',
    'Puntaje Técnico IA',
    'Puntaje Experiencia IA',
    'Puntaje Formación IA',
    'Índice Global Idoneidad IA',
    'Propuesta IA',
    'Decisión Jefe RRHH',
    'Días en Proceso',
  ];

  const rows = candidates.map((c) => {
    const s = c.psychEvaluation.scores;
    return [
      c.fullName,
      c.age,
      c.originLocation,
      c.university,
      c.career,
      c.yearsWorked,
      c.specifications.join('; '),
      c.sourceBoardName,
      c.targetRoleTitle,
      c.psychEvaluation.status,
      s ? s.estabilidadEmocional : '-',
      s ? s.toleranciaFaenaAltura : '-',
      s ? s.apegoSeguridadHSEC : '-',
      s ? s.trabajoEquipo : '-',
      s ? s.razonamientoOperativo : '-',
      c.psychEvaluation.averageScore ?? '-',
      c.psychEvaluation.aptitudeLevel,
      c.metricReport.technicalSpecsScore,
      c.metricReport.experienceScore,
      c.metricReport.educationCareerScore,
      c.metricReport.overallScore,
      c.aiProposedDecision,
      c.decision,
      c.processDaysElapsed,
    ]
      .map(escapeCsvCell)
      .join(',');
  });

  return '\uFEFF' + [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
}

/**
 * Generates UTF-8 BOM CSV with process KPIs, vacancy coverage, and job board metrics.
 */
export function buildProcessKPIsCSV(
  jobNeeds: JobNeed[],
  jobBoards: JobBoardChannel[],
  kpis: RecruitmentKPIs
): string {
  const lines: string[] = [];
  lines.push(['RESUMEN KPI PROCESO RECLUTAMIENTO', 'Compañía Minera Las Bravas'].map(escapeCsvCell).join(','));
  lines.push(['Cobertura Total de Vacantes', `${kpis.filledVacancies}/${kpis.totalVacancies} (${kpis.coveragePercent}%)`].map(escapeCsvCell).join(','));
  lines.push(['Total Candidatos en Proceso', kpis.totalCandidates].map(escapeCsvCell).join(','));
  lines.push(['Pruebas Psicológicas Completadas', kpis.psychCompletedCount].map(escapeCsvCell).join(','));
  lines.push(['Tiempo Promedio Proceso (Días)', kpis.avgProcessDays].map(escapeCsvCell).join(','));
  lines.push(['Bolsa con Mayor Aporte', `${kpis.topBoardName} (${kpis.topBoardCandidates} candidatos)`].map(escapeCsvCell).join(','));
  lines.push('');

  lines.push(['VACANTE', 'ÁREA', 'URGENCIA', 'REQUERIDAS', 'CUBIERTAS', 'PENDIENTES', 'BOLSAS PUBLICADAS', 'ESTADO'].map(escapeCsvCell).join(','));
  for (const n of jobNeeds) {
    lines.push(
      [
        n.title,
        n.department,
        n.urgency,
        n.vacancies,
        n.filledCount,
        Math.max(0, n.vacancies - n.filledCount),
        n.publishedBoards.join('; '),
        n.status,
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  }
  lines.push('');

  lines.push(['BOLSA DE TRABAJO', 'CATEGORÍA', 'PROPUESTAS ENVIADAS', 'CANDIDATOS ENVIADOS', 'PRESELECCIONADOS IA', 'CONTRATADOS', 'RESPUESTA PROMEDIO (HRS)'].map(escapeCsvCell).join(','));
  for (const b of jobBoards) {
    lines.push(
      [
        b.name,
        b.category,
        b.proposalsSent,
        b.candidatesReceived,
        b.shortlistedCount,
        b.hiredCount,
        b.avgResponseHours,
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  }

  return '\uFEFF' + lines.join('\r\n');
}

function escapeHtml(raw: string | number | null | undefined): string {
  const s = raw === null || raw === undefined ? '' : String(raw);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderWordBar(score: number, color = '#B26337'): string {
  const safe = Math.max(0, Math.min(100, Math.round(score)));
  return `<div style="width:100%;background-color:#EFEFF1;height:8px;border-radius:4px;overflow:hidden;"><div style="width:${safe}%;background-color:${color};height:8px;"></div></div>`;
}

/**
 * Generates a clean executive Word-compatible (.doc HTML) individual candidate evaluation report
 * for immediate delivery to the General Manager / Administrator.
 */
export function buildCandidateWordReportHtml(
  candidate: Candidate,
  companyName: string,
  hrChiefName: string
): string {
  const s = candidate.psychEvaluation.scores;
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>Informe Candidato - ${escapeHtml(candidate.fullName)}</title>
<style>
  body { font-family: Calibri, Arial, sans-serif; color: #23272E; margin: 28px; line-height: 1.45; }
  .banner { border-bottom: 3px solid #B26337; padding-bottom: 10px; margin-bottom: 14px; }
  .brand { color: #B26337; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.8px; }
  h1 { color: #23272E; font-size: 20px; margin: 3px 0 4px 0; }
  .sub { color: #5C626D; font-size: 11px; }
  h2 { color: #8C4722; font-size: 13px; text-transform: uppercase; letter-spacing: 0.4px; margin-top: 18px; margin-bottom: 6px; border-bottom: 1px solid #E2E4E8; padding-bottom: 3px; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 11.5px; }
  th, td { border: 1px solid #D8DCE0; padding: 6px 8px; text-align: left; }
  th { background-color: #F7F7F8; color: #23272E; font-weight: bold; }
  .kpi-grid { width: 100%; border-collapse: separate; border-spacing: 8px 0; margin: 10px -8px; }
  .kpi-box { border: 1px solid #E2E4E8; background-color: #F7F7F8; padding: 8px 10px; text-align: center; width: 25%; }
  .kpi-lbl { font-size: 10px; color: #5C626D; text-transform: uppercase; }
  .kpi-val { font-size: 18px; font-weight: bold; color: #23272E; margin-top: 2px; }
  .highlight { background-color: #FBF4EE; border: 1px solid #E6CDBE; padding: 10px 12px; margin-top: 12px; font-size: 12px; }
  .sign-table { margin-top: 24px; border: none; }
  .sign-table td { border: none; border-top: 1px solid #8F959E; width: 45%; padding-top: 6px; text-align: center; font-size: 11px; color: #5C626D; }
</style>
</head>
<body>
  <div class="banner">
    <div class="brand">${escapeHtml(companyName)} · Reporte Ejecutivo de Selección</div>
    <h1>Ficha Integral de Candidato: ${escapeHtml(candidate.fullName)}</h1>
    <div class="sub">Emitido por Control Jefe de RR.HH. (${escapeHtml(hrChiefName)}) · Generado: ${escapeHtml(candidate.metricReport.generatedAt)}</div>
  </div>

  <table class="kpi-grid">
    <tr>
      <td class="kpi-box"><div class="kpi-lbl">Índice Global IA</div><div class="kpi-val" style="color:#B26337;">${candidate.metricReport.overallScore}/100</div></td>
      <td class="kpi-box"><div class="kpi-lbl">Psicológico</div><div class="kpi-val">${candidate.metricReport.psychScore}/100</div></td>
      <td class="kpi-box"><div class="kpi-lbl">Experiencia</div><div class="kpi-val">${candidate.yearsWorked} años</div></td>
      <td class="kpi-box"><div class="kpi-lbl">Decisión Actual</div><div class="kpi-val" style="font-size:13px;">${escapeHtml(candidate.decision)}</div></td>
    </tr>
  </table>

  <h2>1. Datos Generales y Perfil Profesional</h2>
  <table>
    <tr><th>Nombre Completo</th><td>${escapeHtml(candidate.fullName)}</td><th>Edad</th><td>${escapeHtml(candidate.age)} años</td></tr>
    <tr><th>Procedencia</th><td>${escapeHtml(candidate.originLocation)}</td><th>Bolsa de Origen</th><td>${escapeHtml(candidate.sourceBoardName)}</td></tr>
    <tr><th>Universidad / Instituto</th><td>${escapeHtml(candidate.university)}</td><th>Carrera</th><td>${escapeHtml(candidate.career)}</td></tr>
    <tr><th>Tiempo Trabajado</th><td>${escapeHtml(candidate.yearsWorked)} años</td><th>Vacante Postulada</th><td>${escapeHtml(candidate.targetRoleTitle)}</td></tr>
    <tr><th>Contacto</th><td>${escapeHtml(candidate.phoneOrEmail)}</td><th>Propuesta IA</th><td>${escapeHtml(candidate.aiProposedDecision)}</td></tr>
  </table>

  <h2>2. Especificaciones Técnicas y Trayectoria</h2>
  <p style="font-size:12px;"><strong>Especificaciones acreditadas:</strong> ${escapeHtml(candidate.specifications.join(' · '))}</p>
  <p style="font-size:12px;"><strong>Resumen de experiencia:</strong> ${escapeHtml(candidate.workHistorySummary)}</p>

  <h2>3. Desempeño por Pilar del Puesto (Observación IA)</h2>
  <table>
    <tr><th style="width:32%;">Métrica Evaluada</th><th style="width:14%;">Puntaje</th><th style="width:24%;">Indicador Visual</th><th>Observación</th></tr>
    <tr><td>Especificaciones Técnicas y Faena</td><td><strong>${candidate.metricReport.technicalSpecsScore}/100</strong></td><td>${renderWordBar(candidate.metricReport.technicalSpecsScore, '#23272E')}</td><td>Cruce con requisitos del cargo</td></tr>
    <tr><td>Experiencia y Tiempo Trabajado</td><td><strong>${candidate.metricReport.experienceScore}/100</strong></td><td>${renderWordBar(candidate.metricReport.experienceScore, '#5C626D')}</td><td>${candidate.yearsWorked} años acreditados</td></tr>
    <tr><td>Formación / Universidad / Carrera</td><td><strong>${candidate.metricReport.educationCareerScore}/100</strong></td><td>${renderWordBar(candidate.metricReport.educationCareerScore, '#7A818D')}</td><td>${escapeHtml(candidate.career)}</td></tr>
    <tr><td>Evaluación Psicológica Automática</td><td><strong>${candidate.metricReport.psychScore}/100</strong></td><td>${renderWordBar(candidate.metricReport.psychScore, '#B26337')}</td><td>${escapeHtml(candidate.psychEvaluation.aptitudeLevel)} (${escapeHtml(candidate.psychEvaluation.status)})</td></tr>
    <tr><th>Índice Global de Idoneidad</th><th>${candidate.metricReport.overallScore}/100</th><th>${renderWordBar(candidate.metricReport.overallScore, '#B26337')}</th><th>${escapeHtml(candidate.metricReport.fitVerdict)}</th></tr>
  </table>

  <h2>4. Resultados de Prueba Psicológica Automática</h2>
  ${
    s
      ? `<table>
    <tr><th>Estabilidad Emocional</th><th>Tolerancia Faena / Altura</th><th>Apego Seguridad HSEC</th><th>Trabajo en Equipo</th><th>Razonamiento Operativo</th><th>Promedio</th></tr>
    <tr><td>${s.estabilidadEmocional}/100${renderWordBar(s.estabilidadEmocional, '#5C626D')}</td><td>${s.toleranciaFaenaAltura}/100${renderWordBar(s.toleranciaFaenaAltura, '#5C626D')}</td><td>${s.apegoSeguridadHSEC}/100${renderWordBar(s.apegoSeguridadHSEC, '#B26337')}</td><td>${s.trabajoEquipo}/100${renderWordBar(s.trabajoEquipo, '#5C626D')}</td><td>${s.razonamientoOperativo}/100${renderWordBar(s.razonamientoOperativo, '#5C626D')}</td><td><strong>${candidate.psychEvaluation.averageScore}/100</strong></td></tr>
  </table>`
      : `<p style="font-size:12px;">Prueba psicológica en estado: ${escapeHtml(candidate.psychEvaluation.status)} (Código: ${escapeHtml(candidate.psychEvaluation.accessCode)}).</p>`
  }
  <p style="font-size:12px; margin-top:6px;">${escapeHtml(candidate.psychEvaluation.aiPsychObservation)}</p>

  <div class="highlight">
    <strong>Dictamen Consolidado de la IA para Gerencia General:</strong><br/>
    ${escapeHtml(candidate.metricReport.aiDetailedReport)}
    ${candidate.managerNotes ? `<br/><br/><strong>Nota Jefe de RR.HH.:</strong> ${escapeHtml(candidate.managerNotes)}` : ''}
  </div>

  <table class="sign-table">
    <tr>
      <td><strong>${escapeHtml(hrChiefName)}</strong><br/>Jefe de Recursos Humanos · ${escapeHtml(companyName)}</td>
      <td style="border:none;width:10%;"></td>
      <td><strong>Visto Bueno Gerencia General</strong><br/>Administración Superior</td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generates a full executive Word-compatible (.doc HTML) report for the Company Administrator / General Manager
 * covering KPIs, visual progress gauges, vacancy coverage, job board ranking, and candidate scorecards.
 */
export function buildAdminWordReportHtml(
  state: AppStatePayload,
  kpis: RecruitmentKPIs
): string {
  const rankedBoards = [...state.jobBoards].sort(
    (a, b) => b.candidatesReceived - a.candidatesReceived
  );
  const maxBoardCands = Math.max(1, rankedBoards[0]?.candidatesReceived ?? 1);

  const topCandidates = [...state.candidates]
    .sort((a, b) => b.metricReport.overallScore - a.metricReport.overallScore)
    .slice(0, 3);

  const vacancyRows = state.jobNeeds
    .map((n) => {
      const pct = n.vacancies > 0 ? Math.round((n.filledCount / n.vacancies) * 100) : 0;
      return `<tr><td><strong>${escapeHtml(n.title)}</strong></td><td>${escapeHtml(n.department)}</td><td>${escapeHtml(n.urgency)}</td><td>${n.filledCount}/${n.vacancies} (${pct}%)</td><td style="width:110px;">${renderWordBar(pct, '#B26337')}</td><td>${escapeHtml(n.publishedBoards.join(', '))}</td><td>${escapeHtml(n.status)}</td></tr>`;
    })
    .join('');

  const boardRows = rankedBoards
    .map((b, idx) => {
      const pct = Math.round((b.candidatesReceived / maxBoardCands) * 100);
      return `<tr><td>0${idx + 1}. <strong>${escapeHtml(b.name)}</strong></td><td>${escapeHtml(b.category)}</td><td>${b.proposalsSent}</td><td><strong>${b.candidatesReceived}</strong></td><td style="width:120px;">${renderWordBar(pct, idx === 0 ? '#B26337' : '#7A818D')}</td><td>${b.shortlistedCount}</td><td>${b.hiredCount}</td></tr>`;
    })
    .join('');

  const candidateRows = state.candidates
    .map(
      (c) =>
        `<tr><td><strong>${escapeHtml(c.fullName)}</strong></td><td>${c.age}</td><td>${escapeHtml(c.originLocation)}</td><td>${escapeHtml(c.university)} / ${escapeHtml(c.career)}</td><td>${c.yearsWorked} años</td><td>${escapeHtml(c.sourceBoardName)}</td><td>${c.psychEvaluation.averageScore ?? 'Pend.'}</td><td><strong>${c.metricReport.overallScore}/100</strong>${renderWordBar(c.metricReport.overallScore, '#B26337')}</td><td>${escapeHtml(c.decision)}</td></tr>`
    )
    .join('');

  const topShortlistHtml = topCandidates
    .map(
      (c, i) =>
        `<tr><td>#${i + 1}</td><td><strong>${escapeHtml(c.fullName)}</strong></td><td>${escapeHtml(c.targetRoleTitle)}</td><td>${c.yearsWorked} años</td><td>${c.psychEvaluation.averageScore ?? 'Pend.'}/100</td><td><strong>${c.metricReport.overallScore}/100</strong></td><td>${escapeHtml(c.decision)}</td></tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>Informe Ejecutivo Gerencia - ${escapeHtml(state.companyName)}</title>
<style>
  body { font-family: Calibri, Arial, sans-serif; color: #23272E; margin: 28px; line-height: 1.4; }
  .banner { border-bottom: 3px solid #B26337; padding-bottom: 10px; margin-bottom: 14px; }
  .brand { color: #B26337; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.8px; }
  h1 { color: #23272E; font-size: 20px; margin: 3px 0 4px 0; }
  .sub { color: #5C626D; font-size: 11px; }
  h2 { color: #8C4722; font-size: 13px; text-transform: uppercase; letter-spacing: 0.4px; margin-top: 20px; margin-bottom: 6px; border-bottom: 1px solid #E2E4E8; padding-bottom: 3px; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 11px; }
  th, td { border: 1px solid #D8DCE0; padding: 5px 7px; text-align: left; vertical-align: middle; }
  th { background-color: #F7F7F8; color: #23272E; }
  .kpi-grid { width: 100%; border-collapse: separate; border-spacing: 8px 0; margin: 10px -8px; }
  .kpi-box { border: 1px solid #E2E4E8; background-color: #F7F7F8; padding: 8px 10px; text-align: center; width: 25%; }
  .kpi-lbl { font-size: 10px; color: #5C626D; text-transform: uppercase; }
  .kpi-val { font-size: 18px; font-weight: bold; color: #23272E; margin-top: 2px; }
  .sign-table { margin-top: 26px; border: none; }
  .sign-table td { border: none; border-top: 1px solid #8F959E; width: 45%; padding-top: 6px; text-align: center; font-size: 11px; color: #5C626D; }
</style>
</head>
<body>
  <div class="banner">
    <div class="brand">${escapeHtml(state.companyName)} · Dirección y Gerencia General</div>
    <h1>Informe Ejecutivo de Reclutamiento y Selección IA</h1>
    <div class="sub">Preparado para Gerencia General / Administración · Responsable: ${escapeHtml(state.hrChiefName)} (${escapeHtml(state.hrChiefTitle)}) · Fecha: ${getTodayYYYYMMDD()}</div>
  </div>

  <table class="kpi-grid">
    <tr>
      <td class="kpi-box"><div class="kpi-lbl">Cobertura de Vacantes</div><div class="kpi-val" style="color:#B26337;">${kpis.coveragePercent}%</div><div class="sub">${kpis.filledVacancies}/${kpis.totalVacancies} plazas</div></td>
      <td class="kpi-box"><div class="kpi-lbl">Candidatos Evaluados</div><div class="kpi-val">${kpis.totalCandidates}</div><div class="sub">${kpis.psychCompletedCount} con prueba psico.</div></td>
      <td class="kpi-box"><div class="kpi-lbl">Bolsa Líder</div><div class="kpi-val" style="font-size:13px;">${escapeHtml(kpis.topBoardName)}</div><div class="sub">${kpis.topBoardCandidates} postulantes</div></td>
      <td class="kpi-box"><div class="kpi-lbl">Tiempo y Calibración IA</div><div class="kpi-val">${kpis.avgProcessDays} días</div><div class="sub">Acuerdo IA/RR.HH.: ${kpis.aiAgreementRate}%</div></td>
    </tr>
  </table>

  <h2>1. Terna Ejecutiva Prioritaria (Mejores Puntuaciones IA)</h2>
  <table>
    <tr><th>Orden</th><th>Candidato</th><th>Cargo Objetivo</th><th>Experiencia</th><th>Psicológico</th><th>Global IA</th><th>Estado</th></tr>
    ${topShortlistHtml}
  </table>

  <h2>2. Vacantes por Cubrir y Avance Visual</h2>
  <table>
    <tr><th>Puesto / Cargo</th><th>Área</th><th>Urgencia</th><th>Cobertura</th><th>Avance</th><th>Bolsas Publicadas</th><th>Estado</th></tr>
    ${vacancyRows}
  </table>

  <h2>3. Ranking de Bolsas de Trabajo (Propuestas vs Candidatos Recibidos)</h2>
  <table>
    <tr><th>Bolsa / Canal</th><th>Categoría</th><th>Propuestas</th><th>Candidatos</th><th>Aporte Relativo</th><th>Preselección</th><th>Contratados</th></tr>
    ${boardRows}
  </table>

  <h2>4. Base Maestra de Candidatos y Métricas Completas</h2>
  <table>
    <tr><th>Nombre</th><th>Edad</th><th>Procedencia</th><th>Universidad / Carrera</th><th>Experiencia</th><th>Bolsa</th><th>Psico.</th><th>Global IA</th><th>Decisión</th></tr>
    ${candidateRows}
  </table>

  <table class="sign-table">
    <tr>
      <td><strong>${escapeHtml(state.hrChiefName)}</strong><br/>${escapeHtml(state.hrChiefTitle)} · ${escapeHtml(state.companyName)}</td>
      <td style="border:none;width:10%;"></td>
      <td><strong>Gerencia General / Administrador</strong><br/>Recepción de Informe Ejecutivo</td>
    </tr>
  </table>
</body>
</html>`;
}
