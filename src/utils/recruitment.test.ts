import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../data/seedData';
import {
  buildAdminWordReportHtml,
  buildCandidatesTelemetryCSV,
  computeCandidateScoreReport,
  computeRecruitmentKPIs,
  evaluatePsychometricBattery,
  scorePsychAnswersToMetrics,
} from './recruitment';

test('evaluatePsychometricBattery calculates weighted average and aptitude level', () => {
  const res = evaluatePsychometricBattery({
    estabilidadEmocional: 88,
    toleranciaFaenaAltura: 84,
    apegoSeguridadHSEC: 92,
    trabajoEquipo: 85,
    razonamientoOperativo: 80,
  });
  assert.equal(res.aptitudeLevel, 'Apto Recomendado');
  assert.ok(res.averageScore >= 85);
  assert.match(res.aiPsychObservation, /Seguridad HSEC/);
});

test('scorePsychAnswersToMetrics maps 1-5 survey answers to 0-100 scale', () => {
  const high = scorePsychAnswersToMetrics({
    estabilidad: 5,
    tolerancia: 5,
    seguridad: 5,
    equipo: 4,
    razonamiento: 4,
  });
  assert.equal(high.apegoSeguridadHSEC, 98);
  assert.equal(high.trabajoEquipo, 86);
});

test('computeCandidateScoreReport integrates psychometric results and learned HR corrections', () => {
  const state = createInitialState();
  const baseCand = state.candidates[0];
  const need = state.jobNeeds.find((n) => n.id === baseCand.targetNeedId);
  const criteriaWithCorrection = [
    {
      id: 'crit-corr-1',
      title: 'Priorizar experiencia en altura y planta concentradora',
      appliesToDepartment: 'Operaciones Mina',
      weightLabel: 'Prioritario' as const,
      ruleText: 'Valorar operarios con certificacion HSEC y experiencia real en altura sobre 4000 msnm.',
      isCorrection: true,
      wrongAiAssumption: 'La IA dio bajo puntaje por falta de maestria.',
      createdBy: 'Elena Vargas',
      createdAt: '2026-11-19',
    },
  ];

  const report = computeCandidateScoreReport(baseCand, need, criteriaWithCorrection);
  assert.ok(report.aiObservedScore >= 75);
  assert.equal(report.aiAppliedCorrectionTitle, 'Priorizar experiencia en altura y planta concentradora');
  assert.match(report.metricReport.aiDetailedReport, /Apliqué la corrección del Jefe de RR\.HH\./);
});

test('computeRecruitmentKPIs ranks top job board and computes vacancy coverage', () => {
  const state = createInitialState();
  const kpis = computeRecruitmentKPIs(state);
  assert.ok(kpis.totalVacancies >= 5);
  assert.ok(kpis.coveragePercent >= 0 && kpis.coveragePercent <= 100);
  assert.equal(kpis.topBoardName, 'Computrabajo Minería');
  assert.ok(kpis.topBoardCandidates > 0);
});

test('CSV and Word report exports include full candidate metrics and company branding', () => {
  const state = createInitialState();
  const kpis = computeRecruitmentKPIs(state);
  const csv = buildCandidatesTelemetryCSV(state.candidates);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.match(csv, /Universidad \/ Instituto/);
  assert.match(csv, /Apego|Seguridad HSEC/);

  const docHtml = buildAdminWordReportHtml(state, kpis);
  assert.match(docHtml, /Compañía Minera Las Bravas/);
  assert.match(docHtml, /Ranking de Bolsas de Trabajo/);
});
