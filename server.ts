import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { createInitialState } from './src/data/seedData';
import type {
  AppStatePayload,
  Candidate,
  CandidateDecision,
  DataCenterStatus,
  JobNeed,
  JobUrgency,
  PsychTestScores,
  RecruitmentCriterion,
} from './src/types';
import {
  buildAdminWordReportHtml,
  buildCandidatesTelemetryCSV,
  buildCandidateWordReportHtml,
  buildProcessKPIsCSV,
  computeCandidateScoreReport,
  computeRecruitmentKPIs,
  evaluatePsychometricBattery,
  getCurrentHHMM,
  getTodayYYYYMMDD,
  scorePsychAnswersToMetrics,
} from './src/utils/recruitment';

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

function loadOrInitState(): AppStatePayload {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<AppStatePayload>;
      if (
        parsed &&
        parsed.companyName === 'Compañía Minera Las Bravas' &&
        Array.isArray(parsed.candidates) &&
        Array.isArray(parsed.jobBoards) &&
        Array.isArray(parsed.jobNeeds)
      ) {
        return parsed as AppStatePayload;
      }
    }
  } catch (err) {
    console.error('Error reading store.json, reinitializing Las Bravas state:', err);
  }
  const initial = createInitialState();
  saveState(initial);
  return initial;
}

function saveState(state: AppStatePayload): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STORE_PATH, JSON.stringify(state, null, 2), 'utf-8');
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

function recalculateAllCandidates(state: AppStatePayload): Candidate[] {
  return state.candidates.map((cand) => {
    const need = state.jobNeeds.find((n) => n.id === cand.targetNeedId);
    const updated = computeCandidateScoreReport(cand, need, state.recruitmentCriteria);
    return {
      ...cand,
      ...updated,
    };
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  let appState = loadOrInitState();

  // --- Core State ---
  app.get('/api/state', (_req, res) => {
    res.json(appState);
  });

  app.post('/api/state/reset', (_req, res) => {
    appState = createInitialState();
    saveState(appState);
    res.json(appState);
  });

  // --- Vacancies & Job Boards ---
  app.post('/api/recruitment/needs', (req, res) => {
    const {
      title,
      department,
      urgency,
      vacancies,
      requiredSkills,
      technicalSpecifications,
      companyContext,
      publishedBoards,
      targetDaysToFill,
    } = req.body as {
      title?: string;
      department?: string;
      urgency?: JobUrgency;
      vacancies?: number;
      requiredSkills?: string;
      technicalSpecifications?: string;
      companyContext?: string;
      publishedBoards?: string[];
      targetDaysToFill?: number;
    };

    if (!title?.trim() || !requiredSkills?.trim()) {
      res.status(400).json({ error: 'Indica el cargo requerido y las competencias técnicas.' });
      return;
    }

    const boardsList = Array.isArray(publishedBoards) && publishedBoards.length > 0
      ? publishedBoards
      : ['Computrabajo Minería', 'Portal Talento Las Bravas'];

    const newNeed: JobNeed = {
      id: `need-${Date.now()}`,
      title: title.trim(),
      department: department?.trim() || 'Operaciones Mina',
      urgency: urgency || 'Media',
      vacancies: Math.max(1, Number(vacancies) || 1),
      filledCount: 0,
      requiredSkills: requiredSkills.trim(),
      technicalSpecifications:
        technicalSpecifications?.trim() || requiredSkills.trim(),
      companyContext:
        companyContext?.trim() || 'Vacante abierta desde Control Jefe de RR.HH.',
      publishedBoards: boardsList,
      openedAt: getTodayYYYYMMDD(),
      targetDaysToFill: Math.max(5, Number(targetDaysToFill) || 20),
      createdBy: appState.hrChiefName,
      status: 'Abierta',
    };

    appState.jobNeeds.unshift(newNeed);

    // Register proposal dispatch to selected job boards
    const today = getTodayYYYYMMDD();
    appState.jobBoards = appState.jobBoards.map((board) =>
      boardsList.includes(board.name)
        ? {
            ...board,
            proposalsSent: board.proposalsSent + 1,
            lastProposalAt: today,
          }
        : board
    );

    saveState(appState);
    res.json({ need: newNeed, state: appState });
  });

  app.post('/api/recruitment/job-boards/send', (req, res) => {
    const { boardId, needId } = req.body as {
      boardId?: string;
      needId?: string;
    };

    const board = appState.jobBoards.find((b) => b.id === boardId);
    const need = appState.jobNeeds.find((n) => n.id === needId);
    if (!board || !need) {
      res.status(400).json({ error: 'Selecciona una bolsa de trabajo y una vacante válida.' });
      return;
    }

    const today = getTodayYYYYMMDD();
    appState.jobBoards = appState.jobBoards.map((b) =>
      b.id === board.id
        ? { ...b, proposalsSent: b.proposalsSent + 1, lastProposalAt: today }
        : b
    );

    appState.jobNeeds = appState.jobNeeds.map((n) =>
      n.id === need.id && !n.publishedBoards.includes(board.name)
        ? { ...n, publishedBoards: [...n.publishedBoards, board.name] }
        : n
    );

    saveState(appState);
    res.json({ sent: true, state: appState });
  });

  // --- Candidates ---
  app.post('/api/recruitment/candidates', (req, res) => {
    const {
      fullName,
      age,
      originLocation,
      university,
      career,
      yearsWorked,
      workHistorySummary,
      specifications,
      phoneOrEmail,
      sourceBoardId,
      targetNeedId,
      interviewNotes,
    } = req.body as {
      fullName?: string;
      age?: number;
      originLocation?: string;
      university?: string;
      career?: string;
      yearsWorked?: number;
      workHistorySummary?: string;
      specifications?: string[] | string;
      phoneOrEmail?: string;
      sourceBoardId?: string;
      targetNeedId?: string;
      interviewNotes?: string;
    };

    if (!fullName?.trim() || !career?.trim()) {
      res.status(400).json({ error: 'Completa el nombre completo y la carrera del postulante.' });
      return;
    }

    const need =
      appState.jobNeeds.find((n) => n.id === targetNeedId) ?? appState.jobNeeds[0];
    const board =
      appState.jobBoards.find((b) => b.id === sourceBoardId) ?? appState.jobBoards[0];

    const specsArray = Array.isArray(specifications)
      ? specifications
      : typeof specifications === 'string'
      ? specifications
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const draftCandidate: Omit<
      Candidate,
      'metricReport' | 'aiObservedScore' | 'aiProposedDecision' | 'aiAppliedCorrectionTitle' | 'aiSummary'
    > = {
      id: `cand-${Date.now()}`,
      fullName: fullName.trim(),
      age: Math.max(18, Math.min(75, Number(age) || 30)),
      originLocation: originLocation?.trim() || 'Arequipa, Perú',
      university: university?.trim() || 'Instituto / Universidad Técnica',
      career: career.trim(),
      yearsWorked: Math.max(0, Number(yearsWorked) || 2),
      workHistorySummary:
        workHistorySummary?.trim() ||
        `${Math.max(0, Number(yearsWorked) || 2)} años de experiencia laboral relacionada con ${career.trim()}.`,
      specifications: specsArray.length > 0 ? specsArray : ['Disponibilidad turno 14x7'],
      phoneOrEmail: phoneOrEmail?.trim() || 'Sin contacto registrado',
      sourceBoardId: board?.id || 'board-computrabajo',
      sourceBoardName: board?.name || 'Computrabajo Minería',
      targetNeedId: need?.id || '',
      targetRoleTitle: need?.title || 'Postulante General',
      interviewNotes: interviewNotes?.trim() || 'Ingresado para pre-evaluación IA.',
      psychEvaluation: {
        testBatteryName: 'Batería Psicolaboral Minera 14x7 (HSEC + Altura)',
        accessCode: `BRV-PS-${Math.floor(500 + Math.random() * 499)}`,
        status: 'Sin enviar',
        scores: null,
        averageScore: null,
        aptitudeLevel: 'Pendiente',
        aiPsychObservation:
          'Aún no se ha enviado la prueba psicológica automática al candidato.',
      },
      managerScore: null,
      decision: 'Pendiente de revisión',
      processDaysElapsed: 1,
      createdAt: getTodayYYYYMMDD(),
    };

    const evalRes = computeCandidateScoreReport(
      draftCandidate,
      need,
      appState.recruitmentCriteria
    );
    const newCandidate: Candidate = {
      ...draftCandidate,
      ...evalRes,
    };

    appState.candidates.unshift(newCandidate);
    if (board) {
      appState.jobBoards = appState.jobBoards.map((b) =>
        b.id === board.id ? { ...b, candidatesReceived: b.candidatesReceived + 1 } : b
      );
    }

    saveState(appState);
    res.json({ candidate: newCandidate, state: appState });
  });

  // --- Jefe de RR.HH. Approval or AI Correction ---
  app.post('/api/recruitment/candidates/:id/evaluate', (req, res) => {
    const { id } = req.params;
    const {
      managerScore,
      decision,
      managerNotes,
      evaluatedBy,
      teachAi,
      criterionTitle,
      criterionRule,
      criterionWeight,
      isCorrection,
      wrongAiAssumption,
    } = req.body as {
      managerScore?: number;
      decision?: CandidateDecision;
      managerNotes?: string;
      evaluatedBy?: string;
      teachAi?: boolean;
      criterionTitle?: string;
      criterionRule?: string;
      criterionWeight?: 'Prioritario' | 'Importante' | 'Deseable';
      isCorrection?: boolean;
      wrongAiAssumption?: string;
    };

    const existing = appState.candidates.find((c) => c.id === id);
    if (!existing) {
      res.status(404).json({ error: 'Candidato no encontrado.' });
      return;
    }

    const cleanScore = Math.max(1, Math.min(5, Number(managerScore) || 4));
    const finalDecision: CandidateDecision = decision || existing.decision;
    const reviewer = evaluatedBy || appState.hrChiefName;
    const need = appState.jobNeeds.find((n) => n.id === existing.targetNeedId);
    const correctionFlag = Boolean(isCorrection);

    let createdCriterion: RecruitmentCriterion | null = null;
    if ((teachAi || correctionFlag) && (criterionRule?.trim() || managerNotes?.trim())) {
      createdCriterion = {
        id: `rcrit-${Date.now()}`,
        title:
          criterionTitle?.trim() ||
          (correctionFlag
            ? `Corrección Jefe RR.HH.: ${existing.targetRoleTitle}`
            : `Criterio observado en ${existing.fullName}`),
        appliesToDepartment: need?.department || 'Todos',
        weightLabel: criterionWeight || 'Prioritario',
        ruleText:
          criterionRule?.trim() ||
          managerNotes?.trim() ||
          `Evaluación ${cleanScore}/5 para ${existing.targetRoleTitle}`,
        isCorrection: correctionFlag,
        wrongAiAssumption: correctionFlag
          ? wrongAiAssumption?.trim() || existing.aiSummary
          : undefined,
        learnedFromCandidate: existing.fullName,
        createdBy: reviewer,
        createdAt: getTodayYYYYMMDD(),
      };
      appState.recruitmentCriteria.unshift(createdCriterion);
    }

    // Update vacancy coverage if hired for the first time
    if (finalDecision === 'Contratado' && existing.decision !== 'Contratado' && need) {
      appState.jobNeeds = appState.jobNeeds.map((n) => {
        if (n.id !== need.id) return n;
        const nextFilled = Math.min(n.vacancies, n.filledCount + 1);
        return {
          ...n,
          filledCount: nextFilled,
          status: nextFilled >= n.vacancies ? 'Cubierta' : 'Abierta',
        };
      });
      appState.jobBoards = appState.jobBoards.map((b) =>
        b.id === existing.sourceBoardId
          ? { ...b, hiredCount: b.hiredCount + 1 }
          : b
      );
    } else if (
      finalDecision === 'Preseleccionado' &&
      existing.decision !== 'Preseleccionado'
    ) {
      appState.jobBoards = appState.jobBoards.map((b) =>
        b.id === existing.sourceBoardId
          ? { ...b, shortlistedCount: b.shortlistedCount + 1 }
          : b
      );
    }

    appState.candidates = appState.candidates.map((cand) =>
      cand.id === id
        ? {
            ...cand,
            managerScore: cleanScore,
            decision: finalDecision,
            wasAiCorrected: correctionFlag,
            managerNotes: managerNotes?.trim() || cand.managerNotes,
            evaluatedBy: reviewer,
            evaluatedAt: `${getTodayYYYYMMDD()} ${getCurrentHHMM()}`,
          }
        : cand
    );

    // Recalculate AI metric reports across all candidates with newly learned rules
    appState.candidates = recalculateAllCandidates(appState);

    const updatedCandidate = appState.candidates.find((c) => c.id === id);
    saveState(appState);
    res.json({ candidate: updatedCandidate, criterion: createdCriterion, state: appState });
  });

  // --- Automated Psychological Tests ---
  app.post('/api/recruitment/psych-tests/send', (req, res) => {
    const { candidateId, testBatteryName } = req.body as {
      candidateId?: string;
      testBatteryName?: string;
    };

    const existing = appState.candidates.find((c) => c.id === candidateId);
    if (!existing) {
      res.status(404).json({ error: 'Candidato no encontrado.' });
      return;
    }

    const battery =
      testBatteryName?.trim() ||
      existing.psychEvaluation.testBatteryName ||
      'Batería Psicolaboral Minera 14x7 (HSEC + Altura)';

    appState.candidates = appState.candidates.map((c) =>
      c.id === existing.id
        ? {
            ...c,
            psychEvaluation: {
              ...c.psychEvaluation,
              testBatteryName: battery,
              status: 'Enviada',
              sentAt: `${getTodayYYYYMMDD()} ${getCurrentHHMM()}`,
              sentBy: appState.hrChiefName,
              aiPsychObservation: `Prueba "${battery}" enviada por ${appState.hrChiefName}. Esperando respuestas automáticas del postulante.`,
            },
          }
        : c
    );

    saveState(appState);
    res.json({ state: appState });
  });

  app.post('/api/recruitment/psych-tests/:candidateId/submit', (req, res) => {
    const { candidateId } = req.params;
    const { answers, directScores, durationSeconds } = req.body as {
      answers?: {
        estabilidad: number;
        tolerancia: number;
        seguridad: number;
        equipo: number;
        razonamiento: number;
      };
      directScores?: PsychTestScores;
      durationSeconds?: number;
    };

    const existing = appState.candidates.find((c) => c.id === candidateId);
    if (!existing) {
      res.status(404).json({ error: 'Candidato no encontrado.' });
      return;
    }

    const finalScores: PsychTestScores = directScores
      ? directScores
      : scorePsychAnswersToMetrics(
          answers ?? {
            estabilidad: 4,
            tolerancia: 4,
            seguridad: 5,
            equipo: 4,
            razonamiento: 4,
          }
        );

    const psychSummary = evaluatePsychometricBattery(finalScores);

    appState.candidates = appState.candidates.map((c) =>
      c.id === existing.id
        ? {
            ...c,
            psychEvaluation: {
              ...c.psychEvaluation,
              status: 'Completada',
              completedAt: `${getTodayYYYYMMDD()} ${getCurrentHHMM()}`,
              durationSeconds: durationSeconds ?? 640,
              scores: finalScores,
              averageScore: psychSummary.averageScore,
              aptitudeLevel: psychSummary.aptitudeLevel,
              aiPsychObservation: psychSummary.aiPsychObservation,
            },
          }
        : c
    );

    // AI observes the updated psychometric table and automatically recalculates the candidate's full metric report
    appState.candidates = recalculateAllCandidates(appState);

    const updated = appState.candidates.find((c) => c.id === candidateId);
    saveState(appState);
    res.json({ candidate: updated, state: appState });
  });

  // --- Gemini Deep Candidate Report (Optional Server-Side AI Enhancement) ---
  app.post('/api/ai/evaluate-candidate', async (req, res) => {
    const { candidateId } = req.body as { candidateId?: string };
    const cand = appState.candidates.find((c) => c.id === candidateId);
    if (!cand) {
      res.status(404).json({ error: 'Candidato no encontrado.' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error:
          'Falta GEMINI_API_KEY en el servidor (Settings > Secrets). La evaluación automática local sigue activa.',
      });
      return;
    }

    const need = appState.jobNeeds.find((n) => n.id === cand.targetNeedId);
    const criteriaText = appState.recruitmentCriteria
      .map(
        (r) =>
          `- [${r.isCorrection ? 'CORRECCIÓN JEFE RR.HH.' : r.weightLabel} | ${r.appliesToDepartment}] ${r.title}: ${r.ruleText}`
      )
      .join('\n');

    try {
      const response = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: `Analiza integralmente a este postulante de Compañía Minera Las Bravas:
Nombre: ${cand.fullName} (${cand.age} años, de ${cand.originLocation})
Formación: ${cand.career} en ${cand.university}
Experiencia: ${cand.yearsWorked} años (${cand.workHistorySummary})
Especificaciones técnicas: ${cand.specifications.join(', ')}
Puesto objetivo: ${cand.targetRoleTitle} (${need?.technicalSpecifications || ''})
Resultados Prueba Psicológica Automática: ${
            cand.psychEvaluation.scores
              ? `Promedio ${cand.psychEvaluation.averageScore}/100 (${cand.psychEvaluation.aptitudeLevel}) - Estabilidad ${cand.psychEvaluation.scores.estabilidadEmocional}, Tolerancia Altura ${cand.psychEvaluation.scores.toleranciaFaenaAltura}, Seguridad HSEC ${cand.psychEvaluation.scores.apegoSeguridadHSEC}, Equipo ${cand.psychEvaluation.scores.trabajoEquipo}, Razonamiento ${cand.psychEvaluation.scores.razonamientoOperativo}`
              : 'Pendiente de completar'
          }
Criterios aprendidos del Jefe de RR.HH.:
${criteriaText || 'Sin criterios adicionales'}

Entrega un reporte claro en español para el Administrador.`,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                recommendation: { type: Type.STRING },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                watchouts: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['recommendation', 'strengths', 'watchouts'],
            },
          },
        }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
      ]);

      if (!response || !response.text) {
        res.status(504).json({ error: 'Tiempo de espera agotado con Gemini; usa el reporte automático local.' });
        return;
      }

      const parsed = JSON.parse(response.text) as {
        recommendation: string;
        strengths: string[];
        watchouts: string[];
      };

      const detailedText = `${parsed.recommendation} Fortalezas: ${(parsed.strengths || []).join('; ')}. Puntos a monitorear: ${(parsed.watchouts || []).join('; ')}.`;
      appState.candidates = appState.candidates.map((c) =>
        c.id === cand.id
          ? {
              ...c,
              metricReport: {
                ...c.metricReport,
                aiDetailedReport: detailedText,
                generatedAt: `${getTodayYYYYMMDD()} ${getCurrentHHMM()}`,
              },
            }
          : c
      );
      saveState(appState);
      res.json({ evaluation: parsed, state: appState });
    } catch (err) {
      console.error('Gemini evaluate-candidate error:', err);
      res.status(502).json({ error: 'No se pudo completar el análisis con Gemini.' });
    }
  });

  // --- Downloadable Documents & Telemetry Exports for Administrator ---
  app.get('/api/reports/admin-doc', (_req, res) => {
    const kpis = computeRecruitmentKPIs(appState);
    const html = buildAdminWordReportHtml(appState, kpis);
    const filename = `Informe_Ejecutivo_Las_Bravas_${getTodayYYYYMMDD()}.doc`;
    res.setHeader('Content-Type', 'application/msword; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(html);
  });

  app.get('/api/reports/candidate/:id/doc', (req, res) => {
    const cand = appState.candidates.find((c) => c.id === req.params.id);
    if (!cand) {
      res.status(404).json({ error: 'Candidato no encontrado.' });
      return;
    }
    const html = buildCandidateWordReportHtml(
      cand,
      appState.companyName,
      appState.hrChiefName
    );
    const safeSlug = cand.fullName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '_');
    const filename = `Ficha_${safeSlug}_Las_Bravas.doc`;
    res.setHeader('Content-Type', 'application/msword; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(html);
  });

  app.get('/api/reports/candidates-csv', (_req, res) => {
    const csv = buildCandidatesTelemetryCSV(appState.candidates);
    const filename = `Telemetria_Candidatos_Las_Bravas_${getTodayYYYYMMDD()}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  });

  app.get('/api/reports/kpis-csv', (_req, res) => {
    const kpis = computeRecruitmentKPIs(appState);
    const csv = buildProcessKPIsCSV(appState.jobNeeds, appState.jobBoards, kpis);
    const filename = `KPIs_Bolsas_Vacantes_Las_Bravas_${getTodayYYYYMMDD()}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  });

  // --- Data Center Backup / Restore & Windows 11 Kits ---
  app.get('/api/datacenter/status', (_req, res) => {
    let lastSavedAt = `${getTodayYYYYMMDD()} ${getCurrentHHMM()}`;
    try {
      if (fs.existsSync(STORE_PATH)) {
        const stat = fs.statSync(STORE_PATH);
        lastSavedAt = stat.mtime.toISOString().replace('T', ' ').slice(0, 19);
      }
    } catch {
      // Ignore stat fallback
    }

    const psychCompletedCount = appState.candidates.filter(
      (c) => c.psychEvaluation.status === 'Completada'
    ).length;

    const statusPayload: DataCenterStatus = {
      mode: 'Data Center Local — Compañía Minera Las Bravas (data/store.json)',
      storagePath: 'data/store.json',
      totalRecords:
        appState.candidates.length +
        appState.jobNeeds.length +
        appState.jobBoards.length +
        appState.recruitmentCriteria.length,
      candidatesCount: appState.candidates.length,
      vacanciesCount: appState.jobNeeds.length,
      boardsCount: appState.jobBoards.length,
      criteriaCount: appState.recruitmentCriteria.length,
      psychCompletedCount,
      lastSavedAt,
    };

    res.json(statusPayload);
  });

  app.get('/api/datacenter/backup', (_req, res) => {
    const filename = `LasBravas_DataCenter_Backup_${getTodayYYYYMMDD()}.json`;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(appState, null, 2));
  });

  app.post('/api/datacenter/restore', (req, res) => {
    const incoming = req.body as Partial<AppStatePayload>;
    if (!incoming || !Array.isArray(incoming.candidates) || !Array.isArray(incoming.jobNeeds)) {
      res.status(400).json({ error: 'Archivo de respaldo inválido.' });
      return;
    }

    const base = createInitialState();
    appState = {
      companyName: incoming.companyName || base.companyName,
      hrChiefName: incoming.hrChiefName || base.hrChiefName,
      hrChiefTitle: incoming.hrChiefTitle || base.hrChiefTitle,
      jobNeeds: incoming.jobNeeds,
      jobBoards: incoming.jobBoards ?? base.jobBoards,
      candidates: incoming.candidates,
      recruitmentCriteria: incoming.recruitmentCriteria ?? base.recruitmentCriteria,
    };
    saveState(appState);
    res.json({ restored: true, state: appState });
  });

  app.get('/api/download/windows-installer', (req, res) => {
    const rawParam = typeof req.query.url === 'string' ? req.query.url : '';
    const fallbackOrigin = `${req.protocol}://${req.get('host') || `localhost:${PORT}`}`;
    let safeUrl = fallbackOrigin;

    try {
      const candidate = rawParam || process.env.APP_URL || fallbackOrigin;
      const parsed = new URL(candidate);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        safeUrl = parsed.origin.replace(/["'%&|<>^;`$\\\r\n]/g, '');
      }
    } catch {
      safeUrl = fallbackOrigin.replace(/["'%&|<>^;`$\\\r\n]/g, '');
    }

    const lines = [
      '@echo off',
      'title Instalador Compania Minera Las Bravas - Windows 11',
      'echo ========================================================',
      'echo   Compania Minera Las Bravas - Reclutamiento RR.HH.',
      'echo ========================================================',
      'echo.',
      `set "APP_URL=${safeUrl}"`,
      'set "BROWSER="',
      'if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" set "BROWSER=%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe"',
      'if not defined BROWSER if exist "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" set "BROWSER=%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe"',
      'if not defined BROWSER if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" set "BROWSER=%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe"',
      'if not defined BROWSER if exist "%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe" set "BROWSER=%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe"',
      '',
      'if not defined BROWSER (',
      '  start "" "%APP_URL%"',
      '  exit /b 0',
      ')',
      '',
      'powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $desktop = [Environment]::GetFolderPath(\'Desktop\'); $startMenu = [Environment]::GetFolderPath(\'Programs\'); foreach ($dir in @($desktop, $startMenu)) { $sc = $ws.CreateShortcut((Join-Path $dir \'Las Bravas RRHH.lnk\')); $sc.TargetPath = \'%BROWSER%\'; $sc.Arguments = \'--app=%APP_URL%\'; $sc.Description = \'Compania Minera Las Bravas - Reclutamiento IA\'; $sc.Save() }"',
      'start "" "%BROWSER%" "--app=%APP_URL%"',
      'timeout /t 2 >nul',
      '',
    ];

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="Instalar_Las_Bravas_RRHH_Win11.cmd"'
    );
    res.send(lines.join('\r\n'));
  });

  app.get('/api/download/datacenter-kit', (req, res) => {
    const rawParam = typeof req.query.url === 'string' ? req.query.url : '';
    const fallbackOrigin = `${req.protocol}://${req.get('host') || `localhost:${PORT}`}`;
    let safeUrl = fallbackOrigin;

    try {
      const candidate = rawParam || process.env.APP_URL || fallbackOrigin;
      const parsed = new URL(candidate);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        safeUrl = parsed.origin.replace(/["'%&|<>^;`$\\\r\n]/g, '');
      }
    } catch {
      safeUrl = fallbackOrigin.replace(/["'%&|<>^;`$\\\r\n]/g, '');
    }

    const lines = [
      '@echo off',
      'title Configurador Data Center 24/7 - Compania Minera Las Bravas',
      'echo ====================================================================',
      'echo   Compania Minera Las Bravas - Servidor Local 24/7 (Windows 11)',
      'echo ====================================================================',
      'echo.',
      'powercfg /change standby-timeout-ac 0 >nul 2>&1',
      'powercfg /change hibernate-timeout-ac 0 >nul 2>&1',
      'echo [OK] Suspension desactivada en este equipo conectado a corriente.',
      'powershell -NoProfile -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike \'127.*\' -and $_.IPAddress -notlike \'169.254.*\' } | Select-Object -First 3 -ExpandProperty IPAddress"',
      `set "APP_URL=${safeUrl}"`,
      'start "" "%APP_URL%"',
      'pause',
      '',
    ];

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="Instalar_DataCenter_LasBravas_Win11.cmd"'
    );
    res.send(lines.join('\r\n'));
  });

  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server: httpServer },
        ws: { server: httpServer },
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Compañía Minera Las Bravas RR.HH. running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
